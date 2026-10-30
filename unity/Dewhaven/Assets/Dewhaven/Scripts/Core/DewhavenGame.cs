using System;
using System.Collections;
using System.IO;
using System.Linq;
using UnityEngine;
using UnityEngine.InputSystem;

namespace Dewhaven
{
    public sealed class DewhavenGame : MonoBehaviour
    {
        public static DewhavenGame Instance { get; private set; }
        public GameState State { get; private set; }
        public GameClock Clock { get; private set; }
        public SaveService Saves { get; private set; }
        public WorldView World { get; private set; }
        public PlayerMotor Player { get; private set; }
        public TouchInput Controls { get; private set; }
        public GameUI UI { get; private set; }
        public UserPreferences Preferences { get; private set; }
        public NatureMixer Sound { get; private set; }
        public Camera Camera { get; private set; }
        public ResidentDirector Residents { get; private set; }
        public WorldEffects Effects { get; private set; }
        public NativeFiles Files { get; private set; }
        public AdService Ads { get; private set; }
        public bool IsBackgrounded=>backgroundPause!=null;
        public bool Playing { get; private set; }
        private IDisposable backgroundPause;
        private float fishTime=-1,saveTime;
        private WorldAnchor fishing;
        private readonly RoadTravelPolicy roadTravel=new RoadTravelPolicy();
        public bool ChangingArea=>roadTravel.Busy;
        private void Awake(){Instance=this;}
        private void Start()
        {
#if UNITY_EDITOR
            Application.runInBackground=true;
#endif
            Preferences=UserPreferences.Load();Application.targetFrameRate=Preferences.frameRate;
            ArtBank.Load();Saves=new SaveService(Path.Combine(Application.persistentDataPath,"saves-v2"));
            Camera=UnityEngine.Camera.main;
            if(!Camera){var go=new GameObject("Dewhaven Camera");go.tag="MainCamera";Camera=go.AddComponent<Camera>();}
            Camera.orthographic=true;Camera.orthographicSize=14;Camera.nearClipPlane=.1f;Camera.farClipPlane=100;
            Camera.backgroundColor=new Color(.12f,.16f,.17f);Camera.clearFlags=CameraClearFlags.SolidColor;Camera.transform.position=new Vector3(18,-18,-10);
            if(!Camera.GetComponent<AudioListener>())Camera.gameObject.AddComponent<AudioListener>();
            Controls=gameObject.AddComponent<TouchInput>();Controls.Preferences=Preferences;
            var world=new GameObject("Loaded region");World=world.AddComponent<WorldView>();
            Player=new GameObject("Player · grounded feet").AddComponent<PlayerMotor>();
            Residents=gameObject.AddComponent<ResidentDirector>();Effects=gameObject.AddComponent<WorldEffects>();Sound=gameObject.AddComponent<NatureMixer>();Sound.Setup(Preferences);
            Files=new GameObject("DewhavenNativeFiles").AddComponent<NativeFiles>();
            UI=gameObject.AddComponent<GameUI>();UI.Setup(this);Ads=gameObject.AddComponent<AdService>();Ads.Setup(this);StartCoroutine(UI.Splash());
        }
        public void NewGame(string name,string farm,string appearance,int slot)
        {
            State=GameState.New(name,farm,appearance,slot);Clock=new GameClock(State);UI.Intro(0);
        }
        public void BeginDay(bool save=true)
        {
            Playing=true;Controls.Enabled=true;Player.gameObject.SetActive(true);World.gameObject.SetActive(true);Residents.enabled=true;Player.Setup(State,Clock,Controls);Player.Step=()=>Sound.Play("step");
            EnterArea(State.area,new Vector2(State.x,State.y));UI.ShowHud();if(save)Save();
        }
        public void Continue(int slot)
        {
            var state=Saves.Load(slot,out var message);
            if(state==null){UI.Toast(string.IsNullOrEmpty(message)?"This slot is empty.":message);return;}
            UI.ClosePanel();State=state;State.slot=slot;Clock=new GameClock(State);BeginDay(false);if(!string.IsNullOrEmpty(message))UI.Toast(message);
        }
        public void EnterArea(string id,Vector2 spawn,bool preserveMovement=false)
        {
            if(!preserveMovement)Controls.Clear();Player.Tool.Cancel();Effects.Clear();fishTime=-1;fishing=null;
            State.area=id;World.Build(id,State);
            // A save from the wider landscape returns to its authored entrance.
            if(!World.Area.interior&&(spawn.x<2||spawn.y<2||spawn.x>=World.Area.width-2||spawn.y>=World.Area.height-2))spawn=World.Area.entry;
            if(!SafeLanding(spawn))
            {
                bool found=false;
                foreach(var origin in new[]{spawn,World.Area.entry})
                {
                    if(found)break;
                    for(int radius=0;radius<=8&&!found;radius++)for(int y=-radius;y<=radius&&!found;y++)for(int x=-radius;x<=radius&&!found;x++)
                    {
                        var candidate=new Vector2(Mathf.Floor(origin.x)+x+.5f,Mathf.Floor(origin.y)+y+.5f);
                        if(SafeLanding(candidate)){spawn=candidate;found=true;}
                    }
                }
                if(!found)throw new InvalidOperationException("No safe landing in "+id);
            }
            Player.Warp(spawn);Camera.transform.position=CameraTarget();
            State.discoveries.Add(id);State.Count("visit-"+id);Residents.Load(World,State,Clock);Sound.Environment(id,State.weather);
            State.stats["outdoor-regions"]=ContentRegistry.Read("world")["exteriors"].Count(r=>State.discoveries.Contains((string)r["id"]));
        }
        public void Travel(WorldAnchor anchor)
        {
            if(!ExplorationService.CanTravel(State,anchor.target,out var message)){UI.Toast(message);return;}
            UI.ClosePanel();Sound.Play("door");EnterArea(anchor.target,ExplorationService.Complex(anchor.target)!=null&&anchor.id=="vault-gate"?VaultAuthoring.Entry(anchor.target):anchor.arrival);Save();UI.AreaArrival(World.Area.name);
        }
        public void RefreshWorld(){var p=Player.MapPosition;EnterArea(State.area,p);}
        private void CheckRoadTravel()
        {
            if(UI.HasPanel||fishTime>=0||IsBackgrounded)return;
            var movement=new Vector2(Controls.Movement.x,-Controls.Movement.y);
            foreach(var gate in World.Area.anchors.Where(a=>a.automatic))
            {
                if(!roadTravel.TryStart(gate,Player.MapPosition,movement,Time.realtimeSinceStartup,Clock.IsPaused,Player.Tool.Busy))continue;
                if(!ExplorationService.CanTravel(State,gate.target,out var message)){roadTravel.Reject(Time.realtimeSinceStartup);UI.Toast(message);return;}
                StartCoroutine(CrossRoad(gate));return;
            }
        }
        private IEnumerator CrossRoad(WorldAnchor gate)
        {
            var lease=Clock.Pause("Road crossing");Controls.PreserveDuringTravel=true;UI.PrepareRoadCrossing();
            try
            {
                float duration=Preferences.reducedMotion?.04f:.11f;
                for(float t=0;t<duration;t+=Time.unscaledDeltaTime){UI.RoadFade(t/duration);yield return null;}
                UI.RoadFade(1);
                while(IsBackgrounded)yield return null;
                EnterArea(gate.target,gate.arrival,true);Save();UI.AreaArrival(World.Area.name);
                for(float t=0;t<duration;t+=Time.unscaledDeltaTime){UI.RoadFade(1-t/duration);yield return null;}
            }
            finally
            {UI.RoadFade(0);ReleaseRoadControls(lease);roadTravel.Finish(Time.realtimeSinceStartup);}
        }
        private void ReleaseRoadControls(IDisposable lease)
        {lease.Dispose();Controls.Enabled=!Clock.IsPaused;Controls.PreserveDuringTravel=false;}
        private void Update()
        {
            if(!Playing||State==null||Clock==null)return;
            Clock.Advance(Time.unscaledDeltaTime);
            Controls.Enabled=!Clock.IsPaused;
            if(!ChangingArea&&Keyboard.current!=null&&Keyboard.current.escapeKey.wasPressedThisFrame){if(UI.HasPanel)UI.ClosePanel();else UI.Menu();}
            if(!Clock.IsPaused)
            {
                CheckRoadTravel();
                if(ChangingArea){UI.UpdateHud();return;}
                if(Keyboard.current!=null&&Keyboard.current.spaceKey.wasPressedThisFrame)Act();
                if(fishTime>=0){fishTime+=Time.unscaledDeltaTime;if(fishTime>4.2f){fishTime=-1;UI.Toast("The fish slipped away.");}}
                saveTime+=Time.unscaledDeltaTime;if(saveTime>=45){saveTime=0;Save();}
                if(State.minute>=1560){UI.SleepPrompt(true);}
            }
            UI.UpdateHud();
        }
        private void LateUpdate()
        {
            if(!Playing||!Player)return;
            var target=CameraTarget();
            float k=1-Mathf.Exp(-Time.unscaledDeltaTime/(.14f/Preferences.cameraResponse));
            Camera.transform.position=Vector3.Lerp(Camera.transform.position,target,k);
        }
        private bool SafeLanding(Vector2 p)
        {
            return World.Area.Walkable(Mathf.FloorToInt(p.x),Mathf.FloorToInt(p.y))&&!Physics2D.OverlapCircle(new Vector2(p.x,-p.y+.18f),.23f,1<<8);
        }
        private Vector3 CameraTarget()
        {
            var p=Player.MapPosition;var area=World.Area;
            float halfWidth=Camera.orthographicSize*Camera.aspect;
            float x=Mathf.Clamp(p.x,Mathf.Min(halfWidth,area.width/2f),Mathf.Max(area.width-halfWidth,area.width/2f));
            if(area.interior&&area.style!="cave")x=area.width/2f;
            float y=Mathf.Clamp(p.y+1,Mathf.Min(Camera.orthographicSize,area.height/2f),Mathf.Max(area.height-Camera.orthographicSize,area.height/2f));
            return new Vector3(x,-y,-10);
        }
        public string RepeatTarget()
        {
            var plot=TargetPlot();if(plot!=null)return State.selectedTool+":"+plot.id;
            return World.Area.props.FirstOrDefault(p=>p.resource!=null&&Vector2.Distance(p.position,Player.MapPosition)<1.85f)?.id;
        }
        public WorldAnchor Context()
        {
            if(!Playing)return null;
            var p=Player.MapPosition;
            var resident=Residents.Nearest(p);
            var anchors=World.Area.anchors.Where(a=>!a.automatic&&Vector2.Distance(a.position,p)<=a.range).OrderBy(a=>Vector2.Distance(a.position,p)).ToList();
            if(resident!=null&&Vector2.Distance(resident.position,p)<1.7f)return resident;
            if(anchors.Count>0)return anchors[0];
            return null;
        }
        public PlotState TargetPlot()
        {
            if(State.area!="farm")return null;
            var target=Player.MapPosition+Player.FacingMap*.9f;
            return State.plots.Where(p=>Vector2.Distance(WorldView.PlotPosition(p,State)+Vector2.one*.5f,target)<.82f).OrderBy(p=>Vector2.Distance(WorldView.PlotPosition(p,State)+Vector2.one*.5f,target)).FirstOrDefault();
        }
        public string ActionLabel()
        {
            if(fishTime>=1.5f)return "Reel in";if(fishTime>=0)return "Wait…";
            var context=Context();
            if(context!=null)return context.kind=="shop"?"Shop":context.kind=="letter"?"Read":context.kind=="travel"?"Travel":context.kind=="door"?"Enter":context.kind=="resident"||context.kind=="visitor"?"Talk":context.kind=="shipping"?"Ship":context.kind=="animals"?"Care":context.kind=="sleep"?"Sleep":context.kind=="dungeon"?"Explore":context.kind=="fish"?"Cast":context.kind=="craft"?"Craft":context.kind=="cook"?"Cook":"Use";
            var target=TargetPlot();
            if(target!=null)return IsRipe(target)?"Gather":State.selectedTool=="hand"?"Use":State.selectedTool=="hoe"?"Till":State.selectedTool=="water"?"Water":State.selectedTool=="seed"?"Plant":"Use";
            return "Use";
        }
        public void SelectTool(string tool){State.selectedTool=State.selectedTool==tool?"hand":tool;UI.UpdateHud();Sound.Play("seed");}
        public static bool IsRipe(PlotState plot)=>!string.IsNullOrEmpty(plot.crop)&&plot.growth>=(int)ContentRegistry.Crops[plot.crop]["days"];
        public void Act()
        {
            if(!Playing||Clock.IsPaused||Player.Tool.Busy)return;
            if(fishTime>=0)
            {
                if(fishTime<1.5f)return;
                int n=State.stats.TryGetValue("fish",out int catches)?catches:0;
                string item=State.area=="lake"&&State.minute>=1080&&n%3==2?"moonfish":State.area=="aster-quay"&&n%2==0?"trout":n%5==4?"trout":n%3==1?"perch":"carp";
                if(!InventoryRules.Add(State,item)){UI.Toast("Make room in your bag.");return;}
                State.Count("fish");if(State.area=="aster-quay"&&item=="trout")State.Count("harbour-trout");fishTime=-1;Effects.Burst("water",fishing.position,Player.FacingMap);UI.Toast("Caught "+ContentRegistry.ItemName(item)+".");Sound.Play("water");Save();return;
            }
            var context=Context();
            if(context!=null)
            {
                switch(context.kind)
                {
                    case "door":case "travel":Travel(context);return;
                    case "dungeon":UI.DungeonEntrance(context);return;
                    case "resident":UI.Conversation(context.target);return;
                    case "visitor":UI.Visitor(context.data);return;
                    case "landmark":UI.Landmark(context);return;
                    case "shop":UI.Shop(context);return;
                    case "sleep":UI.SleepPrompt();return;
                    case "shipping":UI.Bag(true);return;
                    case "storage":UI.Storage();return;
                    case "cook":case "craft":UI.Crafting(context);return;
                    case "animals":UI.Animals();return;
                    case "letter":UI.Requests("letter");return;
                    case "fish":
                        if(State.energy<3){UI.Toast("Rest before fishing.");return;}Player.ActiveTool="rod";State.energy-=3;fishing=context;
                        Player.Tool.Start(.82f,()=>{fishTime=0;Sound.Play("water");Effects.Burst("water",context.position,Player.FacingMap);});return;
                    case "mechanism":case "treasure":case "inspect":UI.Exploration(context);return;
                    case "puzzle":UI.Puzzle(context);return;
                    case "worksite":UI.Worksite(context.data);return;
                    case "gathering":UI.Gathering();return;
                    case "adopt":UI.Adoption();return;
                    case "rest":UI.LocalRest(context);return;
                    case "household":UI.Household();return;
                }
            }
            var plot=TargetPlot();
            if(plot!=null)
            {
                string tool=IsRipe(plot)?"hand":State.selectedTool;Player.ActiveTool=tool;
                if(tool=="hoe"&&plot.tilled)return;
                if(tool=="water"&&plot.watered){UI.Toast("Already watered.");return;}
                float duration=tool=="water"?.9f:tool=="hoe"?.64f:tool=="seed"?.62f:.48f;
                if(tool=="water"||tool=="hoe")duration*=FarmingService.ToolSpeed(State);
                Player.Tool.Start(duration,()=>
                {
                    bool changed=FarmingService.Work(State,plot,tool,out var message);
                    if(changed){World.UpdatePlots(State);Effects.Burst(tool,WorldView.PlotPosition(plot,State)+Vector2.one*.5f,Player.FacingMap);Sound.Play(tool);}
                    if(!string.IsNullOrEmpty(message))UI.Toast(message);
                });return;
            }
            var prop=World.Area.props.Where(p=>p.resource!=null&&Vector2.Distance(p.position,Player.MapPosition)<1.85f).OrderBy(p=>Vector2.Distance(p.position,Player.MapPosition)).FirstOrDefault();
            if(prop==null)return;
            string needed=prop.resource=="wood"?"axe":prop.resource=="stone"||prop.resource=="copper"||prop.resource=="iron"||prop.resource=="crystal"?"pick":"hand";
            if(State.selectedTool!=needed){UI.Toast("Use "+(needed=="hand"?"your hands":"the "+needed)+".");return;}
            int energyCost=needed=="hand"?1:FarmingService.ResourceEnergy(State);
            if(State.energy<energyCost){UI.Toast("Rest at your bed.");return;}
            Player.ActiveTool=needed;
            Player.Tool.Start((needed=="axe"?.72f:needed=="pick"?.66f:.48f)*(needed=="hand"?1:FarmingService.ToolSpeed(State)),()=>
            {
                if(!InventoryRules.Add(State,prop.resource,needed=="axe"?3:1)){UI.Toast("Your bag is full.");return;}
                State.energy-=energyCost;State.Count(needed=="axe"?"chopped":needed=="pick"?"mined":"foraged");
                State.removed.Add(prop.id);World.RemoveProp(prop.id);Effects.Burst(needed,prop.position,Player.FacingMap);Sound.Play(needed);UI.Toast("+"+(needed=="axe"?3:1)+" "+ContentRegistry.ItemName(prop.resource));
            });
        }
        public void Sleep()
        {
            UI.ClosePanel();int oldGold=State.gold;
            if(!new FarmRules().FinishDay(State,State.totalDays))return;
            Clock.ResetRemainder();Player.Release();EnterArea("farmhouse",new Vector2(State.x,State.y));if(Save()){UI.Dawn(State.gold-oldGold);Ads?.AfterSleep();}
        }
        public bool Save()
        {
            if(State==null)return true;
            if(Playing){State.x=Player.MapPosition.x;State.y=Player.MapPosition.y;}
            if(Saves.Save(State.slot,State,out _))return true;
            UI.Toast("Couldn't save. Keep the game open and try again.",8);return false;
        }
        public void ToTitle(){if(!Save())return;UI.ClosePanel();Playing=false;Controls.Enabled=false;Player.gameObject.SetActive(false);World.gameObject.SetActive(false);Residents.enabled=false;UI.Title();}
        private void OnApplicationPause(bool pause)
        {
            if(Clock==null){Controls?.Clear();Sound?.Suspend(pause);return;}
            if(pause){if(backgroundPause==null)backgroundPause=Clock.Pause("Android background");if(!UI.NarrationVisible)UI.ClosePanel();Controls.Clear();Player.Release();fishTime=-1;fishing=null;if(Playing)Save();Sound.Suspend(true);}
            else{backgroundPause?.Dispose();backgroundPause=null;Controls.Clear();Sound.Suspend(Ads&&Ads.FullscreenActive);}
        }
        private void OnApplicationQuit(){if(Playing)Save();}
    }
}

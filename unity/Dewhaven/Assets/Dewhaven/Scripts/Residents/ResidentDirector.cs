using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json.Linq;
using UnityEngine;
namespace Dewhaven
{
    public sealed class ResidentDirector : MonoBehaviour
    {
        private sealed class Actor
        {
            public string id,area,phase;
            public JToken definition;
            public SpriteRenderer view;
            public Vector2 position,goal;
            public List<Vector2> path=new List<Vector2>();
            public int waypoint,stop;
            public float animation,idle;
            public bool queued,leaving,visitor;
            public Vector2[] stops;
        }
        private readonly Dictionary<string,Actor> actors=new Dictionary<string,Actor>();
        private readonly Queue<Actor> paths=new Queue<Actor>();
        private WorldView world;
        private GameState state;
        private GameClock clock;
        private int observedMinute=-1;
        private SpriteRenderer talkCue;
        public string Reserved;
        public int ActiveCount=>actors.Count;
        public void Load(WorldView world,GameState state,GameClock clock)
        {
            this.world=world;this.state=state;this.clock=clock;actors.Clear();paths.Clear();observedMinute=-1;Reserved=null;talkCue=null;Sync();
        }
        public string CurrentArea(JToken resident)
        {
            string id=(string)resident["id"];
            if(state.partner==id&&(state.minute<510||state.minute>=1140))return "farmhouse";
            var table=ContentRegistry.Read("quests")["weekly"].FirstOrDefault(g=>(string)g["host"]==id&&CalendarService.Open(state,g));
            if(table!=null)return (string)table["area"];
            if(state.weather=="rain"&&state.minute>=600&&state.minute<1020)return (string)resident["work"];
            var block=resident["schedule"].FirstOrDefault(x=>state.minute>=(int)x["from"]&&state.minute<(int)x["to"]);
            return block==null?(string)resident["home"]:(string)block["area"];
        }
        private Vector2 Door(string room)
        {
            var anchor=world.Area.anchors.FirstOrDefault(x=>x.target==room);
            return anchor?.position??world.Area.entry;
        }
        private Vector2 IndoorPosition(JToken resident)
        {
            if(state.partner==(string)resident["id"]&&state.area=="farmhouse")return new Vector2(6,16.5f);
            var counter=world.Area.anchors.FirstOrDefault(x=>x.kind=="shop");
            if(counter!=null)return counter.position+new Vector2(0,-2.7f);
            return new Vector2(world.Area.width/2+3,Mathf.Min(16,world.Area.height-8));
        }
        private void Sync()
        {
            observedMinute=state.minute;
            foreach(var resident in ContentRegistry.Residents)
            {
                string id=(string)resident["id"],desired=CurrentArea(resident);
                if(actors.TryGetValue(id,out var actor))
                {
                    if(actor.area!=desired&&!actor.leaving)
                    {
                        actor.leaving=true;
                        actor.goal=world.Area.interior?world.Area.entry:Door(desired);Queue(actor);
                    }
                    continue;
                }
                if(desired!=world.Area.id)continue;
                Vector2 start=world.Area.interior?IndoorPosition(resident):Door((string)resident["home"])+new Vector2(0,1);
                var safe=NavGrid.Nearest(world.Area,new Vector2Int((int)start.x,(int)start.y));start=new Vector2(safe.x+.5f,safe.y+.5f);
                var view=SpawnView(resident,start);
                actor=new Actor{id=id,definition=resident,area=desired,position=start,view=view,idle=2+actors.Count*.37f};actors[id]=actor;
                if(!world.Area.interior)
                {
                    bool morning=state.minute<1080;
                    actor.goal=Door(morning?(string)resident["work"]:(string)resident["home"]);Queue(actor);
                }
            }
            SyncVisitors();
        }
        private SpriteRenderer SpawnView(JToken person,Vector2 start)
        {
            var view=ArtBank.Actor(world.Actors,(string)person["sprite"]+"/down/1",start);view.gameObject.name="Resident · "+(string)person["name"];
            view.gameObject.layer=8;var feet=view.gameObject.AddComponent<CircleCollider2D>();feet.radius=.2f;feet.offset=new Vector2(0,.18f);return view;
        }
        private void SyncVisitors()
        {
            if(world.Area.source?["plaza"]==null)return;
            bool open=state.minute>=450&&state.minute<1170&&state.weather!="rain";
            foreach(var visitor in ContentRegistry.Read("visitors")[world.Area.id]??new JArray())
            {
                string id=(string)visitor["id"];
                if(actors.TryGetValue(id,out var existing))
                {if(!open&&!existing.leaving){existing.leaving=true;existing.goal=world.Area.entry;Queue(existing);}continue;}
                if(!open)continue;
                var stops=visitor["route"].Select(p=>new Vector2((float)p[0],(float)p[1])).ToArray();var start=stops[0];
                var safe=NavGrid.Nearest(world.Area,new Vector2Int((int)start.x,(int)start.y));start=new Vector2(safe.x+.5f,safe.y+.5f);
                var actor=new Actor{id=id,definition=visitor,area=world.Area.id,visitor=true,stops=stops,position=start,view=SpawnView(visitor,start),idle=1+actors.Count*.4f};actors[id]=actor;
            }
        }
        private void Queue(Actor actor){if(actor.queued)return;actor.queued=true;paths.Enqueue(actor);}
        private void Update()
        {
            if(state==null)return;
            if(clock.IsPaused){if(talkCue)talkCue.gameObject.SetActive(false);return;}
            if(observedMinute!=state.minute)Sync();
            for(int i=0;i<2&&paths.Count>0;i++)
            {
                var actor=paths.Dequeue();actor.queued=false;actor.path=NavGrid.Route(world.Area,actor.position,actor.goal);actor.waypoint=0;
            }
            var removed=new List<string>();float dt=Mathf.Min(.08f,Time.unscaledDeltaTime);
            foreach(var actor in actors.Values)
            {
                if(!actor.view)continue;
                Vector2 delta=Vector2.zero;
                if(actor.id!=Reserved&&actor.waypoint<actor.path.Count)
                {
                    Vector2 goal=actor.path[actor.waypoint];delta=goal-actor.position;
                    if(delta.magnitude<.12f)actor.waypoint++;
                    else
                    {
                        var player=DewhavenGame.Instance.Player.MapPosition;
                        if(Vector2.Distance(actor.position,player)>.6f)actor.position=Vector2.MoveTowards(actor.position,goal,dt*2.25f);
                    }
                }
                else if(actor.id!=Reserved)
                {
                    if(actor.leaving&&Vector2.Distance(actor.position,actor.goal)<1.5f){Destroy(actor.view.gameObject);removed.Add(actor.id);continue;}
                    actor.idle-=dt;
                    if(actor.idle<=0)
                    {
                        actor.idle=actor.visitor?3+actor.stop%3:5+actor.id.Length;
                        if(actor.visitor){actor.stop=(actor.stop+1)%actor.stops.Length;actor.goal=actor.stops[actor.stop];Queue(actor);continue;}
                        var table=world.Area.anchors.FirstOrDefault(a=>a.kind=="gathering");
                        Vector2 basis=world.Area.interior?IndoorPosition(actor.definition):table!=null&&state.minute>=1080?table.position:world.Area.source?["plaza"]!=null?new Vector2((float)world.Area.source["plaza"][0],(float)world.Area.source["plaza"][1]):actor.position;
                        actor.goal=basis+new Vector2(Mathf.Sin(state.minute+actor.id.Length)*3,Mathf.Cos(state.minute*2+actor.id.Length)*2);
                        Queue(actor);
                    }
                }
                actor.view.transform.position=new Vector3(actor.position.x,-actor.position.y,0);actor.view.sortingOrder=Mathf.RoundToInt(actor.position.y*20)+1;
                bool walking=delta.sqrMagnitude>.03f;string direction=Mathf.Abs(delta.x)>Mathf.Abs(delta.y)?delta.x>0?"right":"left":delta.y<0?"up":"down";
                if(walking)actor.animation+=dt*7;
                actor.view.sprite=ArtBank.Get((string)actor.definition["sprite"]+"/"+(walking?direction:"down")+"/"+(walking?(int)actor.animation%3:1));
            }
            foreach(var id in removed)actors.Remove(id);
            UpdateTalkCue();
        }
        private bool Visible(Actor actor,Vector2 position)
        {
            var hit=Physics2D.Linecast(new Vector2(position.x,-position.y+.18f),new Vector2(actor.position.x,-actor.position.y+.18f),1<<8);
            return !hit.collider||hit.collider.gameObject==actor.view.gameObject;
        }
        private Actor Closest(Vector2 position,float distance)=>actors.Values.Where(x=>x.view&&Vector2.Distance(x.position,position)<distance&&Visible(x,position)).OrderBy(x=>Vector2.Distance(x.position,position)).FirstOrDefault();
        private void UpdateTalkCue()
        {
            var game=DewhavenGame.Instance;var closest=game&&game.Playing&&!game.UI.HasPanel?Closest(game.Player.MapPosition,3.2f):null;
            if(closest==null){if(talkCue)talkCue.gameObject.SetActive(false);return;}
            if(!talkCue){talkCue=ArtBank.Actor(world.Actors,"room/stool",Vector2.zero,.9f);talkCue.sprite=IconArt.Get("talk");talkCue.gameObject.name="Nearby conversation";}
            talkCue.gameObject.SetActive(true);float bob=game.Preferences.reducedMotion?0:Mathf.Sin(Time.unscaledTime*3)*.05f;
            talkCue.transform.position=new Vector3(closest.position.x,-closest.position.y+1.95f+bob,0);talkCue.sortingOrder=Mathf.RoundToInt(closest.position.y*20)+10;
        }
        public bool TryPosition(string id,out Vector2 position)
        {if(actors.TryGetValue(id,out var actor)&&actor.view){position=actor.position;return true;}position=Vector2.zero;return false;}
        public WorldAnchor Nearest(Vector2 position)
        {
            var actor=Closest(position,1.8f);
            return actor==null?null:new WorldAnchor{id=actor.id,kind=actor.visitor?"visitor":"resident",target=actor.id,position=actor.position,label="Talk",data=actor.definition};
        }
    }
}

using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json.Linq;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using static Dewhaven.UIFactory;

namespace Dewhaven
{
    public sealed partial class GameUI : MonoBehaviour
    {
        private DewhavenGame game;
        public Canvas Canvas { get; private set; }
        public RectTransform SafeRoot { get; private set; }
        private RectTransform page,hud,panels,toastRoot;
        private RectTransform panel,coin,actionIcon;
        private TextMeshProUGUI dateText,timeText,goldText,energyText,actionText,toastText,arrival;
        private Image energyFill,actionImage;
        private IDisposable pause;
        private Action closed;
        private static float blockedUntil;
        private float toastUntil,arrivalUntil,coinPulse;
        private int observedGold=-1;
        private float displayedGold;
        private readonly Dictionary<string,Image> selectedTools=new Dictionary<string,Image>();
        private Rect observedSafe;
        private int adSurface;
        private bool voicedPanel,cinematic;
        public bool NarrationVisible=>cinematic||(voicedPanel&&panel!=null);
        public bool HasPanel=>panel!=null;
        public static bool AllowPress=>Time.realtimeSinceStartup>=blockedUntil;
        private float H=>SafeRoot.rect.height;
        private float W=>SafeRoot.rect.width;
        public bool CaptureMode;
        public void Setup(DewhavenGame game)
        {
            this.game=game;FontScale=game.Preferences.fontScale;
            var root=new GameObject("Portrait interface",typeof(RectTransform));Canvas=root.AddComponent<Canvas>();Canvas.renderMode=RenderMode.ScreenSpaceOverlay;Canvas.sortingOrder=32760;
            var scaler=root.AddComponent<CanvasScaler>();scaler.uiScaleMode=CanvasScaler.ScaleMode.ScaleWithScreenSize;scaler.referenceResolution=new Vector2(390,844);scaler.matchWidthOrHeight=0;
            root.AddComponent<GraphicRaycaster>();SafeRoot=Fill(root.transform,"Android safe area");ApplySafeArea();
            page=Fill(SafeRoot,"App pages");hud=Fill(SafeRoot,"World controls");panels=Fill(SafeRoot,"Panels");toastRoot=Fill(SafeRoot,"Transient feedback");
            hud.gameObject.SetActive(false);
            if(!EventSystem.current)
            {
                var events=new GameObject("Touch events");events.AddComponent<EventSystem>();var input=events.AddComponent<InputSystemUIInputModule>();input.AssignDefaultActions();
            }
            UnityEngine.Canvas.ForceUpdateCanvases();
        }
        private void ApplySafeArea()
        {
            var safe=CaptureMode?new Rect(0,0,Screen.width,Screen.height):Screen.safeArea;
            if(Screen.width<=0||Screen.height<=0)return;
            SafeRoot.anchorMin=new Vector2(safe.xMin/Screen.width,safe.yMin/Screen.height);
            SafeRoot.anchorMax=new Vector2(safe.xMax/Screen.width,safe.yMax/Screen.height);
            SafeRoot.offsetMax=Vector2.zero;SafeRoot.offsetMin=new Vector2(0,adSurface>0&&game.Ads!=null?game.Ads.ReservationPixels*390f/Screen.width:0);observedSafe=safe;
        }
        private void Update()
        {
            if(!CaptureMode&&observedSafe!=Screen.safeArea)ApplySafeArea();
            if(toastText&&Time.realtimeSinceStartup>toastUntil)toastText.transform.parent.gameObject.SetActive(false);
            if(arrival&&Time.realtimeSinceStartup>arrivalUntil)arrival.gameObject.SetActive(false);
            if(coin&&coinPulse>0)
            {
                coinPulse-=Time.unscaledDeltaTime;float pulse=game.Preferences.reducedMotion?0:Mathf.Sin(Mathf.Clamp01(coinPulse/.6f)*Mathf.PI);
                coin.localScale=Vector3.one*(1+pulse*.18f);coin.localRotation=Quaternion.Euler(0,0,pulse*12);
            }
        }
        private static void Clear(Transform root)
        {foreach(Transform child in root){child.gameObject.SetActive(false);Destroy(child.gameObject);}}
        private void Background(Sprite art)
        {
            var image=Image(page,"Opening painting",0,0,W,H,art);image.preserveAspect=false;
            var fitter=image.gameObject.AddComponent<AspectRatioFitter>();fitter.aspectMode=AspectRatioFitter.AspectMode.EnvelopeParent;fitter.aspectRatio=art.rect.width/art.rect.height;
            var shade=Image(page,"Quiet vignette",0,0,W,H,Gradient());shade.color=Color.white;
        }
        private static Sprite gradient;
        private static Sprite Gradient()
        {
            if(gradient)return gradient;
            var texture=new Texture2D(2,128,TextureFormat.RGBA32,false);texture.filterMode=FilterMode.Bilinear;var colors=new Color[256];
            for(int y=0;y<128;y++)for(int x=0;x<2;x++)colors[y*2+x]=new Color(.055f,.075f,.08f,Mathf.Lerp(.92f,.02f,Mathf.Pow(y/127f,.7f)));
            texture.SetPixels(colors);texture.Apply();gradient=Sprite.Create(texture,new Rect(0,0,2,128),Vector2.one*.5f,100);return gradient;
        }
        public IEnumerator Splash()
        {
            page.gameObject.SetActive(true);Clear(page);Image(page,"Warm sandstone",0,0,W,H,Surface());
            var tex=Resources.Load<Texture2D>("Dewhaven/Art/Brand/icon");var sprite=Sprite.Create(tex,new Rect(0,0,tex.width,tex.height),Vector2.one*.5f,100);
            Image(page,"Dewhaven emblem",W/2-48,H*.38f,96,96,sprite);
            Text(page,"DEWHAVEN",20,H*.38f+116,W-40,38,20,Bronze,false,TextAlignmentOptions.Center);
            yield return new WaitForSecondsRealtime(1.1f);if(!game.Playing&&game.State==null)Title();
        }
        public void Title()
        {
            ClosePanel();BeginAdSurface(1);page.gameObject.SetActive(true);hud.gameObject.SetActive(false);Clear(page);Background(ArtBank.Painting("valley"));
            float titleY=Mathf.Min(H*.59f,H-315);
            Text(page,"A VALLEY TO CALL HOME",24,titleY,W-48,26,14,new Color(.91f,.83f,.65f));
            Text(page,"Dewhaven",22,titleY+28,W-44,70,48,Ivory,true);
            bool saved=Enumerable.Range(0,3).Any(game.Saves.HasSlot);
            Button(page,saved?"Continue your story":"Begin your story",24,H-205,W-48,54,()=>{if(saved)Slots(false);else NewGamePage();},true);
            if(saved)Button(page,"New game",24,H-141,W-48,48,NewGamePage);
            Icon(page,"settings",W/2-83,H-70,48,()=>Settings(0),Ivory,true).GetComponent<Image>().color=new Color(1,1,1,.10f);
            Icon(page,"journal",W/2-24,H-70,48,About,Ivory,true).GetComponent<Image>().color=new Color(1,1,1,.10f);
            Icon(page,"share",W/2+35,H-70,48,Share,Ivory,true).GetComponent<Image>().color=new Color(1,1,1,.10f);
        }
        private void NewGamePage()
        { NamePage("Robin","Amber"); }
        private void NamePage(string playerName,string farmName)
        {
            ClosePanel();
            page.gameObject.SetActive(true);Clear(page);Image(page,"Warm sandstone",0,0,W,H,Surface());
            Icon(page,"close",W-64,16,48,Title);
            Text(page,"Make this place yours.",24,76,W-48,80,32,Ink,true);
            Text(page,"YOUR NAME",24,162,W-48,24,14,Muted);
            var name=Input(page,playerName,"Your name",24,188,W-48,20);
            Text(page,"HOMESTEAD NAME",24,258,W-48,24,14,Muted);
            var farm=Input(page,farmName,"Homestead name",24,284,W-48,24);
            name.onSubmit.AddListener(_=>farm.ActivateInputField());
            farm.onSubmit.AddListener(_=>AppearancePage(name.text,farm.text));
            var frame=Rect(page,"The place ahead",24,390,W-48,Mathf.Max(80,H-502));frame.gameObject.AddComponent<RectMask2D>();
            var painting=Image(frame,"Homestead painting",0,0,W-48,H-502,ArtBank.Painting("homestead"));var fitter=painting.gameObject.AddComponent<AspectRatioFitter>();fitter.aspectMode=AspectRatioFitter.AspectMode.EnvelopeParent;fitter.aspectRatio=painting.sprite.rect.width/painting.sprite.rect.height;
            Button(page,"Choose your traveller",24,H-82,W-48,54,()=>AppearancePage(name.text,farm.text),true);
        }
        private void AppearancePage(string playerName,string farmName)
        {
            Clear(page);Image(page,"Warm sandstone",0,0,W,H,Surface());Icon(page,"close",W-64,16,48,()=>NamePage(playerName,farmName));
            Text(page,"Meet your traveller.",24,76,W-48,80,32,Ink,true);
            string selected="look-fieldkeeper";var previews=new List<Image>();
            string[] ids={"look-fieldkeeper","look-sunfarer","look-wayfarer","look-trailkeeper"};
            var looks=(JArray)ContentRegistry.Read("simulation")["appearances"];
            for(int i=0;i<4;i++)
            {
                int index=i;float x=24+(i%2)*(W-40)/2,y=210+(i/2)*174;
                var b=Button(page,"",x,y,(W-56)/2,158,()=>{selected=ids[index];foreach(var v in previews)v.color=new Color(.93f,.84f,.65f,.32f);previews[index].color=new Color(.75f,.60f,.36f,.45f);});
                previews.Add(b.GetComponent<Image>());previews[i].color=i==0?new Color(.75f,.60f,.36f,.45f):new Color(.93f,.84f,.65f,.32f);
                var sprite=ArtBank.Get((string)looks[i]["frame"]);var preview=Image(b.transform,"Traveller",((W-56)/2-60)/2,12,60,76,sprite);preview.preserveAspect=true;
                Text(b.transform,ContentRegistry.Text(looks[i]["name"]),8,98,(W-56)/2-16,30,18,Ink,false,TextAlignmentOptions.Center);
                Text(b.transform,i==0?"Canvas overalls":i==1?"Working apron":i==2?"Travelling coat":"Leather gear",8,130,(W-56)/2-16,26,14,Muted,false,TextAlignmentOptions.Center);
            }
            Button(page,"Start a new life",24,H-82,W-48,54,()=>
            {
                int slot=Enumerable.Range(0,3).FirstOrDefault(i=>!game.Saves.HasSlot(i));
                if(Enumerable.Range(0,3).All(game.Saves.HasSlot))
                {Confirm("Replace slot 1?","Your other two farms will be kept.",()=>game.NewGame(playerName,farmName,selected,0));return;}
                game.NewGame(playerName,farmName,selected,slot);
            },true);
        }
        public void Intro(int index)
        {
            ClosePanel();Clear(page);page.gameObject.SetActive(true);hud.gameObject.SetActive(false);
            var intro=ContentRegistry.Read("intro")["pages"][index];string voiceKey=(string)intro["voiceKey"];
            cinematic=true;Background(ArtBank.Painting((string)intro["art"]));
            Text(page,"0"+(index+1)+" / 04",W/2-48,26,96,30,14,Ivory,false,TextAlignmentOptions.Center);
            Button(page,"Replay",24,16,92,48,()=>game.Sound.Voice.Play(voiceKey));
            Button(page,"Skip",W-94,16,70,48,Onboarding);
            float extra=Mathf.Lerp(0,102,Mathf.InverseLerp(1,1.35f,FontScale));
            Text(page,(string)intro["title"],24,H-328-extra,W-48,82,30,Ivory,true);
            Text(page,(string)intro["text"],24,H-228-extra,W-48,138+extra,18,Ivory);
            Button(page,index==3?"Begin your morning":"Continue",24,H-78,W-48,52,()=>{if(index<3)Intro(index+1);else Onboarding();},true);
            game.Sound.Voice.Play(voiceKey);
        }
        private void Onboarding()
        {
            cinematic=false;game.Sound.Voice.Stop();
            Clear(page);Image(page,"Warm sandstone",0,0,W,H,Surface());Text(page,"Take your time.",24,110,W-48,80,36,Ink,true);
            string[] title={"Move freely","Choose a tool","Visit the shops"};
            string[] body={"Touch the lower left. It follows your thumb.","Act on the ground in front of you.","Walk to counters for seeds and upgrades."};
            string[] icons={"hand","hoe","door"};
            float start=H<780?208:246,step=(H-116-start)/3;
            for(int i=0;i<3;i++){float y=start+i*step;Image(page,icons[i],24,y+4,42,42,IconArt.Get(icons[i]),Bronze);Text(page,title[i],82,y,W-106,36,19);Text(page,body[i],82,y+40,W-106,Mathf.Min(76,step-44),16,Muted);}
            Button(page,"Open the bedroom door",24,H-82,W-48,54,()=>game.BeginDay(),true);
        }
        public void ShowHud()
        {
            cinematic=false;game.Sound.Voice.Stop();
            Clear(page);page.gameObject.SetActive(false);hud.gameObject.SetActive(true);Clear(hud);selectedTools.Clear();
            FontScale=game.Preferences.fontScale;
            var shade=Image(hud,"Readable sky",0,0,W,118,Gradient(),new Color(1,1,1,.48f));shade.rectTransform.localScale=new Vector3(1,-1,1);shade.rectTransform.anchoredPosition=new Vector2(0,-118);
            dateText=Text(hud,"",16,14,210,28,16,Ivory);
            timeText=Text(hud,"",16,43,150,28,18,Ivory);
            energyText=Text(hud,"",16,73,160,24,14,Ivory);
            Image(hud,"Energy track",16,101,108,4,null,new Color(1,1,1,.2f));energyFill=Image(hud,"Energy",16,101,108,4,null,new Color(.91f,.77f,.47f));
            coin=Image(hud,"Coin",W-136,15,32,32,IconArt.Get("coin")).rectTransform;
            coin.pivot=Vector2.one*.5f;coin.anchoredPosition=new Vector2(W-120,-31);
            goldText=Text(hud,"",W-100,16,84,30,18,Ivory,false,TextAlignmentOptions.MidlineRight);
            foreach(var label in new[]{dateText,timeText,energyText,goldText}){var shadow=label.gameObject.AddComponent<Shadow>();shadow.effectColor=new Color(0,0,0,.35f);shadow.effectDistance=new Vector2(0,-1);}
            Icon(hud,"map",W-174,61,48,Map,null,true);
            Icon(hud,"journal",W-120,61,48,()=>Journal(-1),null,true);
            Icon(hud,"menu",W-66,61,48,Menu,null,true);
            float side=game.Preferences.leftHanded?20:W-108;
            float rise=(game.Preferences.controlHeight-1)*160;
            var action=Icon(hud,"hand",side,H-276-rise,88,null,Ivory,true);action.GetComponent<Image>().color=Ink;
            actionImage=action.transform.GetChild(0).GetComponent<Image>();actionIcon=actionImage.rectTransform;actionIcon.anchoredPosition=new Vector2(19,-8);actionIcon.sizeDelta=new Vector2(50,50);
            actionText=Text(action.transform,"Interact",5,57,78,25,16,Ivory,false,TextAlignmentOptions.Center);
            action.gameObject.AddComponent<HeldAction>().Action=()=>game.Act();
            string[] shortcuts={"hoe","water","seed","axe","pick","bag"};
            for(int i=0;i<6;i++)
            {
                string tool=shortcuts[i];float x=game.Preferences.leftHanded?20+i%3*54:W-174+i%3*54,y=H-166+i/3*58-rise;
                var b=Icon(hud,tool,x,y,48,()=>{if(tool=="bag")Bag();else game.SelectTool(tool);},Ink,true);b.gameObject.name="Shortcut "+tool;
                if(tool!="bag"){var ring=Image(b.transform,"Selected tool",0,0,48,48,ArtBank.Shape("ring"),new Color(.65f,.44f,.20f,.95f));ring.transform.SetAsFirstSibling();selectedTools[tool]=ring;}
            }
            var joystick=Image(hud,"Floating joystick",0,0,112*game.Preferences.joystickSize,112*game.Preferences.joystickSize,ArtBank.Shape("ring"),new Color(.97f,.93f,.82f,.45f));joystick.rectTransform.pivot=Vector2.one*.5f;joystick.rectTransform.anchorMin=joystick.rectTransform.anchorMax=Vector2.one*.5f;
            var knob=Image(joystick.transform,"Thumb",0,0,42,42,ArtBank.Shape("circle"),new Color(.97f,.93f,.82f,.7f));knob.rectTransform.anchorMin=knob.rectTransform.anchorMax=Vector2.one*.5f;knob.rectTransform.pivot=Vector2.one*.5f;knob.rectTransform.anchoredPosition=Vector2.zero;
            game.Controls.JoystickBase=joystick.rectTransform;game.Controls.JoystickKnob=knob.rectTransform;joystick.gameObject.SetActive(false);
            arrival=Text(hud,"",16,128,W-32,34,19,Ivory,true,TextAlignmentOptions.Center);arrival.gameObject.SetActive(false);
            observedGold=-1;UpdateHud();
        }
        public void UpdateHud()
        {
            if(!dateText||game.State==null)return;
            var s=game.State;string[] seasons={"Spring","Summer","Autumn","Winter"};dateText.text=seasons[s.season]+" "+s.day+" · Year "+s.year;
            int hour=s.minute/60%24;timeText.text=hour.ToString("00")+":"+(s.minute%60).ToString("00")+(s.weather=="rain"?"  Rain":"");
            energyText.text="Energy  "+s.energy+" / "+s.maxEnergy;energyFill.rectTransform.sizeDelta=new Vector2(108*s.energy/(float)s.maxEnergy,4);
            if(observedGold<0)displayedGold=s.gold;
            else if(observedGold!=s.gold){coinPulse=.6f;game.Sound.Play("coin");}observedGold=s.gold;
            displayedGold=game.Preferences.reducedMotion?s.gold:Mathf.MoveTowards(displayedGold,s.gold,Mathf.Max(3,Mathf.Abs(s.gold-displayedGold)*12)*Time.unscaledDeltaTime);
            int shown=Mathf.RoundToInt(displayedGold);goldText.text=shown>=1000000?(shown/1000000f).ToString("0.#")+"m":shown>=10000?(shown/1000f).ToString("0.#")+"k":shown.ToString("N0");
            foreach(var indicator in selectedTools)indicator.Value.gameObject.SetActive(indicator.Key==s.selectedTool);
            var context=game.Context();string icon=context==null?s.selectedTool:context.kind=="resident"||context.kind=="visitor"?"talk":context.kind=="door"||context.kind=="travel"?"door":context.kind=="shop"?"bag":context.kind=="fish"?"rod":"hand";
            if(context==null&&game.TargetPlot()!=null&&DewhavenGame.IsRipe(game.TargetPlot()))icon="hand";
            actionImage.sprite=IconArt.Get(icon);actionImage.color=IconArt.IsPainted(actionImage.sprite)?Color.white:Ivory;actionText.text=game.ActionLabel();
        }
        private RectTransform Open(string title,bool dialogue=false)
        {
            ClosePanel();blockedUntil=Time.realtimeSinceStartup+.12f;game.Controls.Clear();
            if(game.Playing)pause=game.Clock.Pause("panel");
            float height=dialogue?Mathf.Min(H-96,Mathf.Max(H*.44f,364)):H;
            panel=Rect(panels,title,0,H-height,W,height);var bg=panel.gameObject.AddComponent<Image>();bg.sprite=Surface();bg.color=Color.white;bg.raycastTarget=true;
            if(!dialogue){Text(panel,title,24,24,W-100,62,30,Ink,true);Icon(panel,"close",W-66,16,48,ClosePanel);Image(panel,"Divider",24,92,W-48,1,null,Sand);}
            return panel;
        }
        public void ClosePanel()
        {
            cinematic=false;voicedPanel=false;game.Sound?.Voice?.Stop();
            adSurface=0;game.Ads?.SetBanner(false);if(SafeRoot){ApplySafeArea();UnityEngine.Canvas.ForceUpdateCanvases();}
            if(panel){panel.gameObject.SetActive(false);Destroy(panel.gameObject);panel=null;}
            pause?.Dispose();pause=null;closed?.Invoke();closed=null;
            if(game.Controls)game.Controls.Clear();if(game.Residents)game.Residents.Reserved=null;
            foreach(var held in hud.GetComponentsInChildren<HeldAction>(true))held.Release();
        }
        private void Pager(Transform parent,int pageIndex,int count,Action<int> change,float y=-1)
        {
            if(count<=1)return;y=y<0?H-82:y;
            Button(parent,"Previous",24,y,120,48,()=>change(Mathf.Max(0,pageIndex-1))).interactable=pageIndex>0;
            Text(parent,(pageIndex+1)+" / "+count,150,y,90,48,16,Muted,false,TextAlignmentOptions.Center);
            Button(parent,"Next",W-144,y,120,48,()=>change(Mathf.Min(count-1,pageIndex+1))).interactable=pageIndex<count-1;
        }
        public void Menu()
        {
            var p=Open("Your day");BeginAdSurface(2);p.sizeDelta=new Vector2(W,H);
            string[] labels={"Map","Journal","Bag","Residents","Calendar","Almanac","Save","Settings","Help","Return to title"};
            Action[] actions={Map,()=>Journal(-1),()=>Bag(),()=>ResidentsPage(0),Calendar,()=>Almanac(0),()=>Slots(true),()=>Settings(0),()=>Help(0),()=>Confirm("Return to title?","Your day will be saved.",()=>game.ToTitle())};
            for(int i=0;i<labels.Length;i++){int index=i;var b=Button(p,labels[i],24+i%2*(W-40)/2,132+i/2*78,(W-56)/2,64,()=>actions[index]());b.GetComponent<Image>().color=Color.clear;}
            Button(p,"About",24,H-70,100,48,About);Button(p,"Share",145,H-70,100,48,Share);Button(p,"Rate",W-124,H-70,100,48,Rate);
        }
        private void BeginAdSurface(int surface){adSurface=surface;game.Ads?.SetBanner(true);ApplySafeArea();UnityEngine.Canvas.ForceUpdateCanvases();}
        public void RefreshAdLayout(){int surface=adSurface;if(surface==1)Title();else if(surface==2)Menu();}
        public void Toast(string message,float duration=2.6f)
        {
            if(string.IsNullOrEmpty(message))return;
            if(!toastText)
            {
                var r=Rect(toastRoot,"Brief feedback",24,H-350,W-48,64);var bg=r.gameObject.AddComponent<Image>();bg.color=new Color(.13f,.17f,.18f,.9f);bg.raycastTarget=false;
                toastText=Text(r,"",12,8,W-72,48,16,Ivory,false,TextAlignmentOptions.Center);
            }
            toastText.fontSize=16*FontScale;toastText.text=message;
            float height=Mathf.Max(48,toastText.GetPreferredValues(message,W-72,Mathf.Infinity).y+4);
            toastText.rectTransform.sizeDelta=new Vector2(W-72,height);((RectTransform)toastText.transform.parent).sizeDelta=new Vector2(W-48,height+16);
            toastText.transform.parent.gameObject.SetActive(true);toastUntil=Time.realtimeSinceStartup+duration;toastText.transform.parent.SetAsLastSibling();
        }
        public void AreaArrival(string title){if(!arrival)return;arrival.text=title;arrival.gameObject.SetActive(true);arrivalUntil=Time.realtimeSinceStartup+2;}
        public void Confirm(string title,string description,Action action)
        {
            var p=Open(title);Text(p,description,24,132,W-48,130,18,Muted);
            Button(p,"Confirm",24,H-146,W-48,52,()=>{ClosePanel();action();},true);Button(p,"Cancel",24,H-80,W-48,48,ClosePanel);
        }
        public void SleepPrompt(bool exhausted=false)
        {
            var p=Open(exhausted?"A late night":"Turn in for the night?");Text(p,exhausted?"It is time to rest. Your bag will be kept.":"Watered crops grow overnight. Your shipment will be paid at dawn.",24,136,W-48,130,18,Muted);
            int shipment=game.State.shipping.Sum(x=>ContentRegistry.SellPrice(x.Key)*x.Value);Text(p,"Shipping  ·  "+shipment.ToString("N0")+" gold",24,320,W-48,54,22,Ink,true);
            if(!exhausted&&game.Context()?.kind=="sleep")Button(p,"Optional demo ad · +25 energy",24,434,W-48,54,()=>game.Ads.RewardRest()).interactable=game.State.energy<game.State.maxEnergy;
            Button(p,"Sleep until morning",24,H-146,W-48,52,()=>game.Sleep(),true);if(!exhausted)Button(p,"Stay awake",24,H-80,W-48,48,ClosePanel);
        }
        public void Dawn(int payment){Toast(payment>0?"Shipment paid  +"+payment.ToString("N0")+" gold":"Your energy is restored.");coinPulse=.6f;}
        public void About()
        {
            var p=Open("Dewhaven");Image(p,"Emblem",W/2-42,132,84,84,IconArt.Get("seed"),Bronze);
            Text(p,"A valley to call home.",24,250,W-48,72,30,Ink,true,TextAlignmentOptions.Center);
            Text(p,"Grow a homestead. Get to know four communities. Reopen the roads between them.",32,350,W-64,132,18,Muted,false,TextAlignmentOptions.Center);
            Text(p,"Nature ambience & physical sound effects.\nPixel art: Super Retro Collection · Gif.\nPhysical foley: Kenney · CC0.",32,H-172,W-64,114,14,Muted,false,TextAlignmentOptions.Center);
        }
        private void Share()
        {
#if UNITY_ANDROID && !UNITY_EDITOR
            using(var player=new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
            using(var activity=player.GetStatic<AndroidJavaObject>("currentActivity"))
            using(var intent=new AndroidJavaObject("android.content.Intent","android.intent.action.SEND"))
            {
                intent.Call<AndroidJavaObject>("setType","text/plain");intent.Call<AndroidJavaObject>("putExtra","android.intent.extra.TEXT","Dewhaven — a valley to call home.");
                using(var chooser=new AndroidJavaClass("android.content.Intent"))activity.Call("startActivity",chooser.CallStatic<AndroidJavaObject>("createChooser",intent,"Share Dewhaven"));
            }
#else
            GUIUtility.systemCopyBuffer="Dewhaven — a valley to call home.";Toast("Dewhaven copied to your clipboard.");
#endif
        }
        private void Rate(){Toast("The store page will be available at launch.");}
    }
}

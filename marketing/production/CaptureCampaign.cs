using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.UI;
using Dewhaven;

public static class DewhavenCampaignCapture
{
    const string Root = "E:/Harvest Moon GPT 61/marketing";
    static readonly BindingFlags Private = BindingFlags.Instance | BindingFlags.NonPublic;
    static readonly PropertyInfo Facing = typeof(PlayerMotor).GetProperty("Facing");
    static readonly PropertyInfo Movement = typeof(TouchInput).GetProperty("Movement");
    static readonly MethodInfo Draw = typeof(PlayerMotor).GetMethod("Draw", Private);
    static readonly MethodInfo CameraTarget = typeof(DewhavenGame).GetMethod("CameraTarget", Private);
    static int PreviousWidth,PreviousHeight;
    static bool OnlyFarm;
    public static string RunFarm(){OnlyFarm=true;return Run();}

    public static string Run()
    {
        Dewhaven.Editor.EditorBridge.EnsureProject();
        var g = DewhavenGame.Instance;
        if (!g || !g.UI) throw new InvalidOperationException("Start the dedicated Dewhaven native player first.");
        Directory.CreateDirectory(Root + "/captures");
        PreviousWidth=Screen.width;PreviousHeight=Screen.height;
        Dewhaven.Editor.BuildProject.SetPortraitGameView(1080,1620);
        File.WriteAllText(Root + "/evidence/capture-status.json", "{\"status\":\"starting\"}");
        g.StartCoroutine(Capture(g));
        return "Dedicated native campaign capture started. Shipping sources, preferences on disk and player saves are preserved.";
    }

    sealed class Shot
    {
        public string id, area, action;
        public Vector2 spawn;
        public float ortho;
        public Shot(string id, string area, float x, float y, float ortho = 14, string action = "walk")
        { this.id=id;this.area=area;spawn=new Vector2(x,y);this.ortho=ortho;this.action=action; }
    }

    static IEnumerator Capture(DewhavenGame g)
    {
        yield return null;yield return null;yield return null;
        var oldState=g.State;var oldSaves=g.Saves;var oldClock=g.Clock;bool oldPlaying=g.Playing;
        string oldPreferences=JsonUtility.ToJson(g.Preferences);
        bool oldEnabled=g.enabled, oldControls=g.Controls.enabled;
        var cam=g.Camera;var canvas=g.UI.Canvas;
        var oldTarget=cam.targetTexture;var oldPosition=cam.transform.position;
        float oldAspect=cam.aspect,oldOrtho=cam.orthographicSize;
        var oldMode=canvas.renderMode;var oldCamera=canvas.worldCamera;bool oldCapture=g.UI.CaptureMode;
        var scaler=canvas.GetComponent<CanvasScaler>();var oldScaleMode=scaler.uiScaleMode;float oldScale=scaler.scaleFactor;
        var oldActive=RenderTexture.active;
        var rtP=new RenderTexture(1080,1620,24);var texP=new Texture2D(1080,1620,TextureFormat.RGB24,false);
        var rtV=new RenderTexture(720,1080,24);var texV=new Texture2D(720,1080,TextureFormat.RGB24,false);
        var rtL=new RenderTexture(1440,810,24);var texL=new Texture2D(1440,810,TextureFormat.RGB24,false);
        var landscapeObject=new GameObject("Temporary marketing capture camera");
        var landscapeCamera=landscapeObject.AddComponent<Camera>();landscapeCamera.CopyFrom(cam);landscapeCamera.enabled=false;
        var manifest=new List<object>();bool complete=false;
        try
        {
            g.UI.ClosePanel();
            typeof(DewhavenGame).GetProperty("Saves").SetValue(g,new SaveService(Path.Combine(Path.GetTempPath(),"Dewhaven-marketing-capture-20261023")));
            g.Preferences.instantText=true;g.Preferences.fontScale=1;g.Preferences.voiceOver=false;
            UIFactory.FontScale=1;
            g.NewGame("Robin","Amber","look-fieldkeeper",0);
            g.State.day=8;g.State.minute=570;g.State.gold=2480;g.State.energy=100;
            string[] crops={"turnip","carrot","potato","cabbage"};
            for(int i=0;i<g.State.plots.Count;i++)
            {
                var p=g.State.plots[i];p.tilled=true;p.crop=crops[i%4];p.growth=i<16?8:1+i%3;p.watered=i%3!=0;
            }
            g.State.animals.Clear();
            g.State.animals.Add(new AnimalState{id="hen-clover",name="Clover",kind="chicken",hearts=4,fed=true,petted=true});
            g.State.animals.Add(new AnimalState{id="pig-bramble",name="Bramble",kind="pig",hearts=3,fed=true,petted=true});
            g.State.animals.Add(new AnimalState{id="rabbit-willow",name="Willow",kind="rabbit",hearts=4,fed=true,petted=true});
            g.State.animals.Add(new AnimalState{id="hen-pip",name="Pip",kind="chicken",hearts=3,fed=true,petted=true});
            g.BeginDay(false);g.UI.ClosePanel();g.UI.ShowHud();
            g.enabled=false;g.Controls.enabled=false;
            canvas.renderMode=RenderMode.ScreenSpaceCamera;canvas.worldCamera=cam;canvas.planeDistance=1;
            g.UI.CaptureMode=true;
            scaler.uiScaleMode=CanvasScaler.ScaleMode.ConstantPixelSize;scaler.scaleFactor=1080f/390f;canvas.scaleFactor=1080f/390f;
            cam.targetTexture=rtP;cam.aspect=2f/3f;Canvas.ForceUpdateCanvases();
            yield return null;yield return null;yield return null;
            var shots=new[]{
                new Shot("01-farm","farm",67.5f,47.9f,14,"water"),
                new Shot("02-village","village",36,39,18,"walk"),
                new Shot("03-lake","lake",38,36.4f,14,"fish"),
                new Shot("04-barn","barn",12,20,14,"idle"),
                new Shot("05-sunridge","sunridge",36,38,18,"walk"),
                new Shot("06-forest","forest",34,34,16,"walk"),
                new Shot("07-vault","tide-vault-2",28,27,16,"idle"),
                new Shot("08-homestead","farm",55,41,16,"walk")
            };
            foreach(var shot in shots)
            {
                if(OnlyFarm&&shot.id!="01-farm")continue;
                File.WriteAllText(Root+"/evidence/capture-status.json",JsonConvert.SerializeObject(new{status="capturing",shot=shot.id}));
                cam.targetTexture=rtP;cam.aspect=2f/3f;Canvas.ForceUpdateCanvases();
                scaler.scaleFactor=1080f/390f;canvas.scaleFactor=1080f/390f;Canvas.ForceUpdateCanvases();
                g.UI.ClosePanel();g.EnterArea(shot.area,shot.spawn);g.UI.ShowHud();
                cam.orthographicSize=shot.ortho;Facing.SetValue(g.Player,"up");Draw.Invoke(g.Player,new object[]{0f});
                g.State.energy=100;g.State.minute=570;g.State.selectedTool=shot.action=="water"?"water":shot.action=="fish"?"rod":"hand";
                if(shot.action=="walk")Movement.SetValue(g.Controls,new Vector2(0,.32f));else Movement.SetValue(g.Controls,Vector2.zero);
                // Let deferred destruction of the previous scene and HUD finish before recording.
                yield return null;yield return null;yield return null;
                string directory=Root+"/captures/"+shot.id;Directory.CreateDirectory(directory+"/portrait");Directory.CreateDirectory(directory+"/landscape");
                var stamps=new List<float>();float started=Time.realtimeSinceStartup;bool still=false;int index=0;float nextAction=.05f;
                while(Time.realtimeSinceStartup-started<4.55f)
                {
                    float t=Time.realtimeSinceStartup-started;
                    if(shot.action=="water"&&t>nextAction&&!g.Player.Tool.Busy)
                    {
                        g.State.energy=100;g.Act();nextAction=t+.95f;
                    }
                    if(shot.action=="fish"&&t>nextAction)
                    {
                        g.Act();nextAction=t+2.2f;
                    }
                    Facing.SetValue(g.Player,"up");
                    cam.aspect=2f/3f;cam.transform.position=(Vector3)CameraTarget.Invoke(g,null);
                    Draw.Invoke(g.Player,new object[]{0f});g.UI.UpdateHud();
                    if(!still&&t>.65f)
                    {
                        Render(cam,canvas,rtP,texP,true,Root+"/captures/"+shot.id+".png",true);
                        still=true;
                    }
                    stamps.Add(t);
                    Render(cam,canvas,rtV,texV,true,directory+"/portrait/"+index.ToString("D5")+".jpg",false);
                    landscapeCamera.CopyFrom(cam);landscapeCamera.enabled=false;
                    Render(landscapeCamera,canvas,rtL,texL,false,directory+"/landscape/"+index.ToString("D5")+".jpg",false);
                    index++;
                    yield return null;
                }
                g.Controls.Clear();Movement.SetValue(g.Controls,Vector2.zero);
                File.WriteAllText(directory+"/timing.json",JsonConvert.SerializeObject(new{duration=Time.realtimeSinceStartup-started,frames=stamps},Formatting.Indented));
                manifest.Add(new{id=shot.id,area=shot.area,frames=index,screenshot=shot.id+".png",portrait="720x1080",landscape="1440x810",canvasSize=g.UI.SafeRoot.rect.size.ToString(),face="player facing up / rear view",stagedSave=true});
            }
            g.UI.ClosePanel();g.EnterArea("farmhouse",new Vector2(12,14));g.UI.ShowHud();
            typeof(GameUI).GetMethod("Journal",Private).Invoke(g.UI,new object[]{-1});yield return null;yield return null;
            Render(cam,canvas,rtP,texP,true,Root+"/captures/09-journal.png",true);
            if(OnlyFarm)
            {
                var previous=JObject.Parse(File.ReadAllText(Root+"/evidence/native-capture-manifest.json"));
                previous["shots"]=new JArray(((JArray)previous["shots"]).Select(x=>(string)x["id"]=="01-farm"?JToken.FromObject(manifest[0]):x));
                previous["farmRecapturedAtUtc"]=DateTime.UtcNow;
                File.WriteAllText(Root+"/evidence/native-capture-manifest.json",previous.ToString());
            }
            else File.WriteAllText(Root+"/evidence/native-capture-manifest.json",JsonConvert.SerializeObject(new{game="Dewhaven",version="2.4.0 source",capturedAtUtc=DateTime.UtcNow,source="Dedicated native Unity editor, in-memory staged demonstration save",shippingCodeChanged=false,shots=manifest},Formatting.Indented));
            complete=true;
        }
        finally
        {
            g.Controls.Clear();g.UI.ClosePanel();g.enabled=oldEnabled;g.Controls.enabled=oldControls;
            JsonUtility.FromJsonOverwrite(oldPreferences,g.Preferences);UIFactory.FontScale=g.Preferences.fontScale;
            cam.targetTexture=oldTarget;cam.aspect=oldAspect;cam.orthographicSize=oldOrtho;cam.transform.position=oldPosition;
            canvas.renderMode=oldMode;canvas.worldCamera=oldCamera;canvas.enabled=true;g.UI.CaptureMode=oldCapture;RenderTexture.active=oldActive;
            scaler.uiScaleMode=oldScaleMode;scaler.scaleFactor=oldScale;
            typeof(DewhavenGame).GetProperty("Saves").SetValue(g,oldSaves);
            typeof(DewhavenGame).GetProperty("State").SetValue(g,oldState);
            typeof(DewhavenGame).GetProperty("Clock").SetValue(g,oldClock);
            typeof(DewhavenGame).GetProperty("Playing").SetValue(g,oldPlaying);
            if(oldPlaying&&oldState!=null)g.BeginDay(false);else{g.Player.gameObject.SetActive(false);g.World.gameObject.SetActive(false);g.UI.Title();}
            UnityEngine.Object.Destroy(rtP);UnityEngine.Object.Destroy(texP);UnityEngine.Object.Destroy(rtV);UnityEngine.Object.Destroy(texV);UnityEngine.Object.Destroy(rtL);UnityEngine.Object.Destroy(texL);
            UnityEngine.Object.Destroy(landscapeObject);
            Canvas.ForceUpdateCanvases();
            Dewhaven.Editor.BuildProject.SetPortraitGameView(PreviousWidth,PreviousHeight);
            File.WriteAllText(Root+"/evidence/capture-status.json",JsonConvert.SerializeObject(new{status=complete?"complete":"failed",restored=true,shots=manifest.Count}));
        }
    }

    static void Render(Camera cam,Canvas canvas,RenderTexture rt,Texture2D texture,bool hud,string path,bool png)
    {
        canvas.enabled=hud;cam.targetTexture=rt;cam.aspect=rt.width/(float)rt.height;
        if(hud){canvas.GetComponent<CanvasScaler>().scaleFactor=rt.width/390f;canvas.scaleFactor=rt.width/390f;}
        Canvas.ForceUpdateCanvases();cam.Render();RenderTexture.active=rt;
        texture.ReadPixels(new Rect(0,0,rt.width,rt.height),0,0);texture.Apply();
        File.WriteAllBytes(path,png?texture.EncodeToPNG():texture.EncodeToJPG(96));canvas.enabled=true;
    }
}

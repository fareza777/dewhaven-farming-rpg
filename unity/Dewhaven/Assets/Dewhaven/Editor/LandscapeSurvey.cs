using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Newtonsoft.Json;
using UnityEngine;
namespace Dewhaven.Editor
{
    public static class LandscapeSurvey
    {
        private const string Folder="E:/Harvest Moon GPT 61/docs/unity/captures/quiet-world";
        public static string Start()
        {
            EditorBridge.EnsureProject();var g=DewhavenGame.Instance;if(!g)throw new InvalidOperationException("Start the native player first.");
            g.StartCoroutine(Capture(g));return "Native landscape contact views queued.";
        }
        private static IEnumerator Capture(DewhavenGame g)
        {
            var records=new List<object>();Directory.CreateDirectory(Folder);
            typeof(DewhavenGame).GetProperty("Saves").SetValue(g,new SaveService(Path.Combine(Path.GetTempPath(),"Dewhaven-quiet-world-review")));
            g.NewGame("Robin","Amber","look-fieldkeeper",0);g.State.minute=560;g.BeginDay(false);g.UI.ClosePanel();
            var lease=g.Clock.Pause("Landscape review");bool shown=g.UI.Canvas.enabled;g.UI.Canvas.enabled=false;
            try
            {
                foreach(string id in ContentRegistry.Read("world")["exteriors"].Select(d=>(string)d["id"]))
                {
                    g.EnterArea(id,RegionAuthoring.EntryFor(id));
                    // Let old scenery and resident views finish their deferred destruction.
                    yield return null;yield return null;yield return null;
                    var a=g.World.Area;var camera=g.Camera;var position=camera.transform.position;float aspect=camera.aspect,ortho=camera.orthographicSize;
                    var previous=camera.targetTexture;var active=RenderTexture.active;
                    int w=768,h=Mathf.RoundToInt(768f*(a.height+6)/(a.width+6));
                    var rt=new RenderTexture(w,h,24);var texture=new Texture2D(w,h,TextureFormat.RGB24,false);
                    try
                    {
                        camera.transform.position=new Vector3(a.width*.5f,-a.height*.5f,-10);camera.orthographicSize=(a.height+6)*.5f;camera.aspect=w/(float)h;camera.targetTexture=rt;
                        camera.Render();RenderTexture.active=rt;texture.ReadPixels(new Rect(0,0,w,h),0,0);texture.Apply();File.WriteAllBytes(Path.Combine(Folder,id+".png"),texture.EncodeToPNG());
                        records.Add(new{area=id,a.width,a.height,props=a.props.Count,solid=a.props.Count(p=>p.solid),anchors=a.anchors.Count,automaticRoads=a.anchors.Count(n=>n.automatic),groundChunks=Mathf.CeilToInt(a.width/32f)*Mathf.CeilToInt(a.height/32f)});
                    }
                    finally{camera.transform.position=position;camera.orthographicSize=ortho;camera.aspect=aspect;camera.targetTexture=previous;RenderTexture.active=active;UnityEngine.Object.Destroy(rt);UnityEngine.Object.Destroy(texture);}
                    yield return null;
                }
                File.WriteAllText("E:/Harvest Moon GPT 61/docs/unity/quiet-world-survey.json",JsonConvert.SerializeObject(new{success=true,areas=records},Formatting.Indented));
            }
            finally{g.UI.Canvas.enabled=shown;lease.Dispose();g.UI.ClosePanel();g.EnterArea("forest",RegionAuthoring.EntryFor("forest"));g.UI.ShowHud();}
        }
    }
}

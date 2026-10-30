using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEngine;
namespace Dewhaven.Editor
{
    public static class CompactCheck
    {
        private static readonly BindingFlags Private=BindingFlags.NonPublic|BindingFlags.Instance;
        public static string Start(bool quietWorld=false)
        {EditorBridge.EnsureProject();var game=DewhavenGame.Instance;if(!game||!game.Playing)throw new InvalidOperationException("Start a review farm first.");game.StartCoroutine(Drive(game,quietWorld));return "One focused native road/input/guest/audio check started.";}
        private static void Check(bool condition,string message){if(!condition)throw new InvalidOperationException(message);}
        private static void Direction(DewhavenGame g,Vector2 map)=>typeof(TouchInput).GetProperty("Movement").SetValue(g.Controls,new Vector2(map.x,-map.y));
        private static void Cross(DewhavenGame g)=>typeof(DewhavenGame).GetMethod("CheckRoadTravel",Private).Invoke(g,null);
        private static void Background(DewhavenGame g,bool pause)=>typeof(DewhavenGame).GetMethod("OnApplicationPause",Private).Invoke(g,new object[]{pause});
        private static IEnumerator Drive(DewhavenGame game,bool quietWorld)
        {
            string error=null;var steps=Steps(game);
            while(true){bool more;object wait=null;try{more=steps.MoveNext();if(more)wait=steps.Current;}catch(Exception e){more=false;error=e.ToString();}if(!more)break;yield return wait;}
            Background(game,false);game.UI.ClosePanel();game.Controls.Clear();
            File.WriteAllText("E:/Harvest Moon GPT 61/docs/unity/"+(quietWorld?"native-quiet-world-check.json":"native-compact-check.json"),Newtonsoft.Json.JsonConvert.SerializeObject(new{passed=error==null,error,physicalDevice=false,simulatedInput=true,checks=new[]{"real game road coroutine farm to village and back","release during transition and input availability at arrival","background retains crossing pause until resumed","safe arrival cannot immediately return","panel blocks automatic crossing","daytime visitors use guest dialogue and preserve friendship state","painted Talk cue is readable at world scale","quiet music and physical audio bank with ten source limit"}},Newtonsoft.Json.Formatting.Indented));
            Debug.Log("Dewhaven compact native flow: "+(error==null?"PASS":"FAIL · "+error));
        }
        private static IEnumerator Steps(DewhavenGame g)
        {
            g.UI.ClosePanel();typeof(DewhavenGame).GetProperty("Saves").SetValue(g,new SaveService(Path.Combine(Path.GetTempPath(),"Dewhaven-compact-check")));
            g.NewGame("Survey","Amber","look-fieldkeeper",0);g.State.minute=560;g.BeginDay(false);
            g.EnterArea("farm",RegionAuthoring.EntryFor("farm"));g.UI.ShowHud();var gate=g.World.Area.anchors.First(a=>a.automatic&&a.target=="village");
            g.Player.Warp(gate.position);g.UI.Menu();Direction(g,gate.outward);Cross(g);Check(!g.ChangingArea,"A panel allowed an automatic crossing.");g.UI.ClosePanel();
            Direction(g,gate.outward);Cross(g);Check(g.ChangingArea&&g.Controls.PreserveDuringTravel,"Road crossing did not preserve movement input.");
            g.Controls.Clear();Background(g,true);yield return new WaitForSecondsRealtime(.22f);Check(g.State.area=="farm"&&g.Clock.IsPaused,"Backgrounding advanced a road crossing.");Background(g,false);
            float deadline=Time.realtimeSinceStartup+4;while(g.ChangingArea&&Time.realtimeSinceStartup<deadline)yield return null;
            Check(!g.ChangingArea&&g.State.area=="village","The road did not arrive in the village.");Check(g.Controls.Enabled&&!g.Controls.PreserveDuringTravel&&!g.Clock.IsPaused,"Arrival left input suppressed or the clock paused.");
            Check(g.Controls.Movement==Vector2.zero,"A released finger resumed stale motion.");var reverse=g.World.Area.anchors.First(a=>a.automatic&&a.target=="farm");
            Direction(g,reverse.outward);Cross(g);Check(!g.ChangingArea&&!reverse.trigger.Contains(g.Player.MapPosition),"Safe landing immediately returned through its road gate.");
            Check(g.Residents.ActiveCount>=3,"Compact town is missing its daytime visitors.");
            Check(g.Residents.TryPosition("visitor-leif",out var visitor),"Leif did not spawn on a public route.");g.Player.Warp(visitor+new Vector2(.6f,0));Direction(g,Vector2.zero);yield return null;
            var context=g.Context();Check(context!=null&&context.kind=="visitor","A nearby visiting speaker has no Talk context.");int friendships=g.State.friends.Count;
            g.UI.Visitor(context.data);Check(g.UI.HasPanel&&g.State.friends.Count==friendships,"Guest dialogue mutated resident relationship state.");g.UI.ClosePanel();yield return null;
            var cue=g.World.Actors.GetComponentsInChildren<SpriteRenderer>(true).FirstOrDefault(v=>v.gameObject.name=="Nearby conversation");Check(cue&&cue.transform.localScale.x>=.8f,"Talk cue is too small to read.");
            var bank=(System.Collections.Generic.Dictionary<string,AudioClip>)typeof(NatureMixer).GetField("clips",Private).GetValue(g.Sound);
            Check(new[]{"river","wind","rain","cavern-water","water-0","water-1","water-2","music-daylight","music-evening","music-trail","music-cavern"}.All(bank.ContainsKey)&&!bank.ContainsKey("birds"),"The quiet soundtrack or physical sound variants are missing.");
            Check(g.Sound.GetComponents<AudioSource>().Length<=10,"Audio source pool grew beyond its budget.");
            yield return new WaitForSecondsRealtime(.85f);g.Player.Warp(reverse.position);Direction(g,reverse.outward);Cross(g);
            deadline=Time.realtimeSinceStartup+4;while(g.ChangingArea&&Time.realtimeSinceStartup<deadline)yield return null;
            Check(g.State.area=="farm"&&!g.Clock.IsPaused&&g.Controls.Enabled,"The return road did not restore the farm controls.");
        }
    }
}

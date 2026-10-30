using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Reflection;
using TMPro;
using UnityEngine;
using UnityEngine.UI;
namespace Dewhaven.Editor
{
    public static class VoiceCheck
    {
        public static string Start()
        {EditorBridge.EnsureProject();var game=DewhavenGame.Instance;if(!game||!game.UI)throw new InvalidOperationException("Start Dewhaven first.");game.StartCoroutine(Drive(game));return "One native narration/lifecycle check started.";}
        private static void Check(bool condition,string error){if(!condition)throw new InvalidOperationException(error);}
        private static void Pause(DewhavenGame game,bool paused)=>typeof(DewhavenGame).GetMethod("OnApplicationPause",BindingFlags.NonPublic|BindingFlags.Instance).Invoke(game,new object[]{paused});
        private static void Click(DewhavenGame game,string label)
        {
            var b=game.UI.Canvas.GetComponentsInChildren<Button>(false).FirstOrDefault(x=>x.interactable&&x.GetComponentsInChildren<TextMeshProUGUI>().Any(t=>t.text==label));
            if(!b)throw new InvalidOperationException("Missing narration action: "+label);b.onClick.Invoke();
        }
        private static IEnumerator Drive(DewhavenGame game)
        {
            bool originalVoice=game.Preferences.voiceOver,originalInstant=game.Preferences.instantText;float originalVolume=game.Preferences.voiceVolume;
            string error=null;var steps=Steps(game);
            while(true)
            {
                bool more;object wait=null;try{more=steps.MoveNext();if(more)wait=steps.Current;}catch(Exception e){more=false;error=e.ToString();}
                if(!more)break;yield return wait;
            }
            Pause(game,false);game.UI.ClosePanel();game.Preferences.voiceOver=originalVoice;game.Preferences.voiceVolume=originalVolume;game.Preferences.instantText=originalInstant;
            File.WriteAllText("E:/Harvest Moon GPT 61/docs/unity/native-voice-check.json",Newtonsoft.Json.JsonConvert.SerializeObject(new{passed=error==null,error,device=false,questRequirementsFixture=true,realAdImpression=false,checks=new[]{"intro speech and next-page cancellation","main objective/opening/completion and replay","retained spoken dialogue pauses/resumes without clock movement","ordinary shop still closes on background","mute cancels speech","only one loaded speech clip"}},Newtonsoft.Json.Formatting.Indented));
            Debug.Log("Dewhaven narration: "+(error==null?"PASS":"FAIL · "+error));
        }
        private static IEnumerator AwaitSpeech(DewhavenGame game,string key)
        {
            float deadline=Time.realtimeSinceStartup+5;
            while(Time.realtimeSinceStartup<deadline&&(game.Sound.Voice.CurrentKey!=key||!game.Sound.Voice.IsSpeaking))yield return null;
            Check(game.Sound.Voice.CurrentKey==key&&game.Sound.Voice.IsSpeaking,"Speech did not start: "+key);
            Check(game.Sound.Voice.LoadedClipCount==1,"Narration loaded more than the current sentence.");
        }
        private static IEnumerator Steps(DewhavenGame game)
        {
            typeof(DewhavenGame).GetProperty("Saves").SetValue(game,new SaveService(Path.Combine(Path.GetTempPath(),"Dewhaven-voice-check")));
            game.Preferences.voiceOver=true;game.Preferences.voiceVolume=.85f;game.Preferences.instantText=true;
            game.NewGame("Robin","Amber","look-fieldkeeper",0);yield return AwaitSpeech(game,"intro-0");
            game.UI.Intro(1);yield return AwaitSpeech(game,"intro-1");yield return new WaitForSecondsRealtime(.15f);
            Pause(game,true);yield return new WaitForSecondsRealtime(.12f);float position=game.Sound.Voice.Position;int minute=game.State.minute;
            yield return new WaitForSecondsRealtime(.2f);Check(game.Sound.Voice.IsSuspended&&Mathf.Abs(position-game.Sound.Voice.Position)<.04f,"Intro speech moved while backgrounded.");
            Check(game.State.minute==minute,"The clock moved in a narrated pause.");Pause(game,false);yield return new WaitForSecondsRealtime(.2f);
            Check(game.Sound.Voice.IsSpeaking&&game.Sound.Voice.Position>position+.03f,"Intro speech did not resume.");
            game.BeginDay(false);game.EnterArea("farmhouse",new Vector2(16.4f,9.8f));game.UI.Requests("letter");yield return AwaitSpeech(game,"quest-new-roots-objective");
            yield return new WaitForSecondsRealtime(.15f);Click(game,"Hear the story");yield return AwaitSpeech(game,"quest-new-roots-opening");
            yield return new WaitForSecondsRealtime(.15f);Click(game,"Replay");yield return AwaitSpeech(game,"quest-new-roots-opening");
            Pause(game,true);yield return new WaitForSecondsRealtime(.15f);Check(game.UI.HasPanel&&game.UI.NarrationVisible&&game.Sound.Voice.IsSuspended,"Backgrounding discarded the spoken dialogue.");Pause(game,false);
            game.State.stats["planted"]=3;game.State.discoveries.Add("farm");game.Player.Warp(game.World.Area.anchors.First(a=>a.kind=="letter").position);
            game.UI.Requests("letter");yield return new WaitForSecondsRealtime(.15f);Click(game,"Hand over & complete");yield return AwaitSpeech(game,"quest-new-roots-completion");
            game.Preferences.voiceOver=false;yield return null;yield return null;Check(!game.Sound.Voice.IsSpeaking&&game.Sound.Voice.CurrentKey==null,"Muting left an old voice playing.");
            game.Preferences.voiceOver=true;game.UI.ClosePanel();yield return null;Check(game.Sound.Voice.LoadedClipCount==0,"A closed story kept its speech loaded.");
            game.State.minute=550;game.EnterArea("market",new Vector2(10,11.2f));game.Act();yield return new WaitForSecondsRealtime(.2f);Check(game.UI.HasPanel&&!game.UI.NarrationVisible,"Shop unexpectedly became a narrated panel.");
            Pause(game,true);Check(!game.UI.HasPanel,"A backgrounded shop remained active.");Pause(game,false);
        }
    }
}

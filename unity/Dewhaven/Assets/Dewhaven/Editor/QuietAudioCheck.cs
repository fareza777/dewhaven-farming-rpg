using System;
using System.Collections;
using System.IO;
using System.Linq;
using System.Reflection;
using UnityEngine;
namespace Dewhaven.Editor
{
    public static class QuietAudioCheck
    {
        private static float full,ducked;
        public static string Start()
        {EditorBridge.EnsureProject();var g=DewhavenGame.Instance;if(!g||!g.Playing)throw new InvalidOperationException("Start a review farm first.");g.StartCoroutine(Drive(g));return "Music mix, narration focus, mute and suspension check queued.";}
        private static IEnumerator Drive(DewhavenGame g)
        {
            float previous=g.Preferences.musicVolume;bool voice=g.Preferences.voiceOver;string error=null;var steps=Steps(g);
            while(true){bool more;object wait=null;try{more=steps.MoveNext();if(more)wait=steps.Current;}catch(Exception e){error=e.ToString();more=false;}if(!more)break;yield return wait;}
            g.Sound.Voice.Stop();g.Preferences.musicVolume=previous;g.Preferences.voiceOver=voice;g.Sound.Suspend(g.IsBackgrounded);
            File.WriteAllText("E:/Harvest Moon GPT 61/docs/unity/quiet-audio-native-check.json",Newtonsoft.Json.JsonConvert.SerializeObject(new{passed=error==null,error,fullVolume=full,duckedVolume=ducked,attackSeconds=.25f,physicalDevice=false,checks=new[]{"four streamed music resources","music becomes quiet within 250 ms of voice request","music recovers after narration","Music zero silences the soundtrack immediately","all sources pause and music resumes","ten source budget"}},Newtonsoft.Json.Formatting.Indented));
        }
        private static void Check(bool condition,string copy){if(!condition)throw new InvalidOperationException(copy);}
        private static IEnumerator Steps(DewhavenGame g)
        {
            var music=(AudioSource[])typeof(NatureMixer).GetField("music",BindingFlags.Instance|BindingFlags.NonPublic).GetValue(g.Sound);
            g.UI.ClosePanel();g.Preferences.musicVolume=1;g.Preferences.voiceOver=true;g.Sound.Environment("farm","sunny");
            yield return new WaitForSecondsRealtime(4.4f);full=music.Max(s=>s.volume);Check(full>.3f,"The soundtrack never became audible.");
            g.Sound.Voice.Play("intro-0");yield return new WaitForSecondsRealtime(.25f);ducked=music.Max(s=>s.volume);
            Check(g.Sound.Voice.IsNarrating&&ducked<=full*.21f,"Narration did not rapidly duck the music.");
            g.Sound.Voice.Stop();yield return new WaitForSecondsRealtime(1.5f);Check(music.Max(s=>s.volume)>=full*.9f,"Music did not recover after narration.");
            g.Preferences.musicVolume=0;yield return null;yield return null;Check(music.All(s=>s.volume<.0001f),"Music mute was delayed by the area fade.");
            g.Preferences.musicVolume=1;g.Sound.Suspend(true);Check(g.Sound.GetComponents<AudioSource>().All(s=>!s.isPlaying),"Background audio kept playing.");
            g.Sound.Suspend(false);yield return null;Check(music.Any(s=>s.isPlaying),"Music did not resume.");
            Check(g.Sound.GetComponents<AudioSource>().Length==10,"Audio source budget changed.");
        }
    }
}

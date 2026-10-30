using System.Collections;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;
namespace Dewhaven
{
    public sealed class VoiceDirector : MonoBehaviour
    {
        private AudioSource source;
        private AudioClip current;
        private UserPreferences preferences;
        private readonly List<string> queue=new List<string>();
        private Coroutine pump;
        private int generation;
        private bool suspended;
        public string CurrentKey { get; private set; }
        public string CurrentClipId { get; private set; }
        public bool IsSpeaking=>source&&source.isPlaying;
        public bool IsSuspended=>suspended;
        public bool IsNarrating=>CurrentKey!=null&&queue.Count>0;
        public float Position=>source&&source.clip?source.time:0;
        public int LoadedClipCount=>current?1:0;
        public void Setup(UserPreferences p)
        {preferences=p;source=gameObject.AddComponent<AudioSource>();source.spatialBlend=0;source.playOnAwake=false;source.loop=false;source.pitch=1;source.priority=0;}
        public void Play(string key)
        {var entry=NarrationCatalog.Entry(key);PlayPage(key,entry==null?new string[0]:entry["segments"].Select(s=>(string)s["id"]).ToArray());}
        public void PlayPage(string key,IEnumerable<string> clips)
        {
            Stop();if(preferences==null||!preferences.voiceOver||preferences.voiceVolume<=0)return;
            queue.AddRange(clips.Where(id=>NarrationCatalog.ClipPath(id)!=null));if(queue.Count==0)return;
            CurrentKey=key;if(pump==null)pump=StartCoroutine(Pump());
        }
        public void Stop()
        {generation++;queue.Clear();CurrentKey=null;CurrentClipId=null;if(source){source.Stop();source.clip=null;}}
        public void Suspend(bool pause)
        {suspended=pause;if(!source)return;if(pause)source.Pause();else source.UnPause();}
        private void Update()
        {if(preferences==null||!source)return;source.volume=Mathf.Clamp01(preferences.voiceVolume);if((!preferences.voiceOver||preferences.voiceVolume<=0)&&IsNarrating)Stop();}
        private IEnumerator Pump()
        {
            // One pump owns every request: a canceled load finishes and releases before the next can start.
            while(queue.Count>0)
            {
                if(suspended){yield return null;continue;}
                int ticket=generation;string id=queue[0];
                var request=Resources.LoadAsync<AudioClip>(NarrationCatalog.ClipPath(id));yield return request;
                var clip=request.asset as AudioClip;
                if(ticket!=generation){if(clip)Resources.UnloadAsset(clip);continue;}
                if(!clip){queue.RemoveAt(0);continue;}
                current=clip;CurrentClipId=id;
                if(clip.loadState==AudioDataLoadState.Unloaded)clip.LoadAudioData();
                while(clip.loadState==AudioDataLoadState.Loading&&ticket==generation)yield return null;
                while(suspended&&ticket==generation)yield return null;
                if(ticket!=generation){Release();continue;}
                if(clip.loadState==AudioDataLoadState.Failed){queue.RemoveAt(0);Release();continue;}
                if(!preferences.voiceOver||preferences.voiceVolume<=0){Stop();Release();continue;}
                source.clip=clip;source.volume=Mathf.Clamp01(preferences.voiceVolume);source.Play();
                while(ticket==generation&&(source.isPlaying||suspended))yield return null;
                if(ticket==generation&&queue.Count>0)queue.RemoveAt(0);
                Release();
            }
            CurrentKey=null;CurrentClipId=null;pump=null;
        }
        private void Release()
        {if(source){source.Stop();source.clip=null;}if(current){current.UnloadAudioData();Resources.UnloadAsset(current);current=null;}CurrentClipId=null;}
        private void OnDestroy(){Stop();Release();}
    }
}

using System.Collections.Generic;
using UnityEngine;
namespace Dewhaven
{
    /// <summary>Restrained field ambience, original ambient music and pooled physical foley.</summary>
    public sealed class NatureMixer : MonoBehaviour
    {
        private readonly AudioSource[] beds=new AudioSource[2],music=new AudioSource[2],foley=new AudioSource[4];
        private readonly float[] musicBlend=new float[2];
        private AudioSource water;
        private readonly Dictionary<string,AudioClip> clips=new Dictionary<string,AudioClip>();
        private UserPreferences preferences;
        private int bedIndex,musicIndex,stepIndex,foleyIndex,variation;
        private string area="farm",weather="clear",bedKey,musicKey;
        private float bedLevel,musicLevel,waterLevel,environmentTimer,lastStep=-1,musicDuck=1;
        private bool suspended;
        public VoiceDirector Voice { get; private set; }
        public void Setup(UserPreferences p)
        {
            preferences=p;
            for(int i=0;i<beds.Length;i++)beds[i]=Source(true);
            for(int i=0;i<music.Length;i++){music[i]=Source(true);music[i].priority=200;}
            for(int i=0;i<foley.Length;i++)foley[i]=Source(false);
            water=Source(true);Voice=gameObject.AddComponent<VoiceDirector>();Voice.Setup(p);
            foreach(string kind in new[]{"river","wind","rain","cavern-water"})Load(kind,"Nature/");
            foreach(string kind in new[]{"daylight","evening","trail","cavern"})Load("music-"+kind,"Music/",kind);
            foreach(string kind in new[]{"step","hoe","seed","axe","pick","hand","door","coin","step-0","step-1","step-2","step-3","hoe-1","pick-1","door-1","water-0","water-1","water-2","ui","page"})Load(kind,"Foley/");
            Environment("farm","clear");
        }
        private AudioSource Source(bool loop)
        {var source=gameObject.AddComponent<AudioSource>();source.playOnAwake=false;source.spatialBlend=0;source.loop=loop;source.volume=0;source.priority=loop?180:90;return source;}
        private void Load(string key,string folder,string file=null)
        {var clip=Resources.Load<AudioClip>("Dewhaven/Audio/"+folder+(file??key));if(clip)clips[key]=clip;}
        public void Environment(string region,string condition)
        {
            area=region;weather=condition;environmentTimer=0;
            var game=DewhavenGame.Instance;var mix=Soundscape.Select(area,weather,game&&game.State!=null?game.State.minute:720);
            string key=mix.nature;bedLevel=mix.natureLevel;musicLevel=mix.musicLevel;
            if(key!=bedKey&&clips.TryGetValue(key,out var clip))
            {
                bedKey=key;bedIndex=1-bedIndex;var bed=beds[bedIndex];bed.Stop();bed.clip=clip;bed.volume=0;bed.Play();if(suspended)bed.Pause();
            }
            if(mix.music!=musicKey&&clips.TryGetValue("music-"+mix.music,out var score))
            {
                musicKey=mix.music;musicIndex=1-musicIndex;musicBlend[musicIndex]=0;var next=music[musicIndex];next.Stop();next.clip=score;next.volume=0;next.Play();if(suspended)next.Pause();
            }
            string waterKey=mix.water;waterLevel=mix.waterLevel;
            if(waterLevel>0&&clips.TryGetValue(waterKey,out var waterClip)&&water.clip!=waterClip)
            {water.Stop();water.clip=waterClip;water.volume=0;water.Play();if(suspended)water.Pause();}
        }
        public void Play(string name)
        {
            if(suspended)return;bool step=name=="step";float gain=step?.38f:name=="ui"?.22f:name=="coin"?.52f:.78f;
            if(step)
            {
                if(Time.unscaledTime-lastStep<.11f)return;lastStep=Time.unscaledTime;name="step-"+(stepIndex++%4);
                var game=DewhavenGame.Instance;
                if(game&&game.World&&game.World.Area!=null)
                {
                    var p=game.Player.MapPosition;var a=game.World.Area;int x=Mathf.Clamp((int)p.x,0,a.width-1),y=Mathf.Clamp((int)p.y,0,a.height-1);
                    if(a.ground[x,y]==7)gain*=1.12f;else if(a.ground[x,y]==0)gain*=.72f;
                }
            }
            else if(name=="water")name="water-"+(variation++%3);
            else if((name=="hoe"||name=="pick"||name=="door")&&variation++%2==1)name+="-1";
            if(!clips.TryGetValue(name,out var clip))return;
            var source=foley[foleyIndex++%foley.Length];source.Stop();source.pitch=name=="coin"||name=="ui"?1:.97f+(foleyIndex%5)*.015f;
            source.volume=preferences.foleyVolume*gain*(Voice&&Voice.IsNarrating?.55f:1);source.clip=clip;source.Play();
        }
        private void Update()
        {
            if(suspended||!beds[0])return;
            environmentTimer+=Time.unscaledDeltaTime;if(environmentTimer>8)Environment(area,weather);
            float focus=Voice&&Voice.IsNarrating?.35f:1,dt=Time.unscaledDeltaTime;
            for(int i=0;i<beds.Length;i++)
            {
                float target=i==bedIndex?preferences.natureVolume*bedLevel*focus:0;
                beds[i].volume=Mathf.MoveTowards(beds[i].volume,target,dt*.42f);
                if(i!=bedIndex&&beds[i].volume<=.001f&&beds[i].isPlaying)beds[i].Stop();
            }
            float duck=Voice&&Voice.IsNarrating?.16f:1;
            musicDuck=Mathf.MoveTowards(musicDuck,duck,dt*(duck<musicDuck?6:.65f));
            for(int i=0;i<music.Length;i++)
            {
                musicBlend[i]=Mathf.MoveTowards(musicBlend[i],i==musicIndex?1:0,dt*.25f);
                music[i].volume=musicBlend[i]*preferences.musicVolume*musicLevel*musicDuck;
                if(i!=musicIndex&&musicBlend[i]<=.001f&&music[i].isPlaying)music[i].Stop();
            }
            water.volume=Mathf.MoveTowards(water.volume,preferences.natureVolume*waterLevel*focus,dt*.3f);
            if(waterLevel<=0&&water.volume<=.001f&&water.isPlaying)water.Stop();
            else if(waterLevel>0&&water.clip&&!water.isPlaying)water.Play();
        }
        public void Suspend(bool pause)
        {
            suspended=pause;Voice?.Suspend(pause);
            foreach(var bed in beds)if(bed){if(pause)bed.Pause();else bed.UnPause();}
            foreach(var score in music)if(score){if(pause)score.Pause();else score.UnPause();}
            if(water){if(pause)water.Pause();else water.UnPause();}
            if(pause)foreach(var source in foley)if(source)source.Stop();
        }
    }
}

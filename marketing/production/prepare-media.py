"""Package original native footage at its observed timing and mix original game audio."""
from pathlib import Path
import json, math, shutil, subprocess, sys
import numpy as np
import soundfile as sf
import imageio_ffmpeg
from scipy.signal import resample_poly

ROOT=Path(__file__).resolve().parents[2]
MARKETING=ROOT/'marketing'
PROJECT=MARKETING/'dewhaven-remotion'
FFMPEG=Path(imageio_ffmpeg.get_ffmpeg_exe())
GAME=ROOT/'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Audio'

def run(args):
    result=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if result.returncode:raise RuntimeError(result.stderr[-4500:])
    return result

def video():
    manifest=json.loads((MARKETING/'evidence/native-capture-manifest.json').read_text())
    for shot in manifest['shots']:
        if '--farm' in sys.argv and shot['id']!='01-farm':continue
        folder=MARKETING/'captures'/shot['id']
        info=json.loads((folder/'timing.json').read_text())
        for orientation in ['portrait','landscape']:
            lines=[]
            for i,t in enumerate(info['frames']):
                duration=(info['frames'][i+1] if i+1<len(info['frames']) else info['duration'])-t
                if i==0:duration+=t
                source=(folder/orientation/(str(i).zfill(5)+'.jpg')).as_posix()
                lines.extend(["file '"+source.replace("'","'\\''")+"'",f'duration {max(duration,.005):.8f}'])
            lines.append(lines[-2])
            listing=folder/(orientation+'-frames.txt');listing.write_text('\n'.join(lines),encoding='utf-8')
            out=PROJECT/'public/gameplay'/(shot['id']+'-'+orientation+'.mp4')
            run([FFMPEG,'-y','-v','error','-f','concat','-safe','0','-i',listing,'-vf','fps=30','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart','-an',out])
        print('Packaged native scene: '+shot['id'],flush=True)
    (PROJECT/'public/stills').mkdir(exist_ok=True)
    for source in (MARKETING/'captures').glob('*.png'):shutil.copy2(source,PROJECT/'public/stills'/source.name)

def audio():
    rate=48000;duration=30;mix=np.zeros((rate*duration,2),np.float64)
    def read(path):
        data,sr=sf.read(path,always_2d=True)
        if data.shape[1]==1:data=np.repeat(data,2,axis=1)
        if sr!=rate:
            common=math.gcd(sr,rate);data=resample_poly(data,rate//common,sr//common,axis=0)
        return data[:,:2]
    def put(path,start,length=None,offset=0,gain=1,fade=.12):
        data=read(path);data=data[int(offset*rate):]
        if length is not None:data=data[:int(length*rate)]
        data=data[:max(0,len(mix)-int(start*rate))].copy()
        n=min(int(fade*rate),len(data)//2)
        if n:
            data[:n]*=np.linspace(0,1,n)[:,None];data[-n:]*=np.linspace(1,0,n)[:,None]
        at=int(start*rate);mix[at:at+len(data)]+=data*gain
    put(GAME/'Music/daylight.ogg',0,3.25,offset=8,gain=1.4,fade=.12)
    put(GAME/'Music/cavern.ogg',2.9,2.4,offset=14,gain=1.4,fade=.2)
    put(GAME/'Music/daylight.ogg',4.95,7.3,offset=24,gain=1.4,fade=.15)
    put(GAME/'Music/evening.ogg',11.9,6.3,offset=26,gain=1.6,fade=.2)
    put(GAME/'Music/trail.ogg',17.9,6.3,offset=20,gain=1.4,fade=.2)
    put(GAME/'Music/daylight.ogg',23.9,6.1,offset=48,gain=1.5,fade=.25)
    cues=[('seed',.18,.3),('water-0',.95,.5),('door',2.98,.4),('pick',3.16,.3),('hoe',5.1,.35),('water-1',6.1,.5),('seed',8.5,.2),('page',10.5,.2),('water-2',12.15,.45),('hand',15.12,.26),('step-0',18.1,.18),('step-1',18.7,.18),('pick-1',21.1,.35),('door-1',24.1,.3),('page',27.1,.26)]
    for name,t,gain in cues:
        path=GAME/'Foley'/(name+'.ogg')
        if path.exists():put(path,t,gain=gain,fade=.01)
    # Very short final fade keeps the end slate gently audible through its hold.
    mix[-int(.55*rate):]*=np.linspace(1,0,int(.55*rate))[:,None]
    mix=np.tanh(mix*.9)
    raw=MARKETING/'production/trailer-mix-unmastered.wav';sf.write(raw,mix,rate,subtype='PCM_24')
    out=PROJECT/'public/audio/dewhaven-trailer-master.wav'
    result=run([FFMPEG,'-y','-hide_banner','-i',raw,'-af','loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json','-ar','48000','-c:a','pcm_s24le',out])
    (MARKETING/'evidence/audio-mastering.txt').write_text(result.stderr,encoding='utf-8')
    print('Mixed and mastered original game score and foley.',flush=True)

if __name__=='__main__':video();audio()

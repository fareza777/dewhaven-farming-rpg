"""Original slow ambient miniatures. No external samples, vocals or percussion."""
from pathlib import Path
import json,hashlib,subprocess
import numpy as np
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Audio/Music'
OUT.mkdir(parents=True,exist_ok=True)
RATE=24000
records=[]
def compose(name,seconds,chords,melody):
    size=RATE*seconds
    mix=np.zeros((size,2),dtype=np.float32)
    def note(midi,start,duration,gain,pan=0,airy=False):
        n=int(duration*RATE);t=np.arange(n,dtype=np.float32)/RATE
        frequency=440*2**((midi-69)/12)
        attack=2.8 if airy else 1.1
        env=(1-np.exp(-t/attack))*np.exp(-t/(duration*.44))
        env*=np.minimum(1,(duration-t)/3.4).clip(0,1)**2
        tone=np.sin(2*np.pi*frequency*t+.002*np.sin(t*.37))
        tone+=.11*np.sin(2*np.pi*frequency*2*t+.3)+.025*np.sin(2*np.pi*frequency*3*t)
        tone*=env*gain
        stereo=np.column_stack((tone*np.sqrt((1-pan)*.5),tone*np.sqrt((1+pan)*.5)))
        ids=(np.arange(n)+int(start*RATE))%size
        mix[ids]+=stereo
    span=seconds/len(chords)
    for i,chord in enumerate(chords):
        for j,midi in enumerate(chord):
            note(midi,i*span+j*.8,span+7,.075 if j==0 else .055,(j-1.5)*.25,True)
    for i,(at,midi) in enumerate(melody):note(midi,at,9,.058,(-1 if i%2 else 1)*.2)
    # Soft, finite diffuse tails. Wrapping makes every loop boundary continuous.
    dry=mix.copy()
    for delay,gain in [(1.13,.12),(2.31,.075),(3.77,.035)]:
        mix+=np.roll(dry[:,::-1],int(delay*RATE),axis=0)*gain
    mix-=mix.mean(axis=0)
    rms=float(np.sqrt(np.mean(mix*mix)));peak=float(np.abs(mix).max())
    mix*=min(.36/(peak+1e-9),.082/(rms+1e-9))
    path=OUT/(name+'.ogg')
    subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(),'-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i','-','-c:a','libvorbis','-q:a','4',str(path)],input=mix.astype('<f4').tobytes(),check=True)
    records.append(dict(name=name,seconds=seconds,sampleRate=RATE,channels=2,peak=round(float(np.abs(mix).max()),4),rms=round(float(np.sqrt(np.mean(mix*mix))),4),bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),chords=chords,melody=melody))

compose('daylight',96,[[50,57,61,66],[43,54,59,62],[47,54,57,62],[45,52,59,64]],[(8,66),(17,64),(37,69),(59,66),(78,64),(87,62)])
compose('evening',104,[[43,50,57,62],[47,54,57,62],[50,57,61,64],[45,52,57,62]],[(14,62),(43,66),(72,64),(94,61)])
compose('trail',96,[[50,57,62,64],[48,55,60,67],[43,50,57,62],[45,52,59,64]],[(12,69),(39,67),(63,66),(84,64)])
compose('cavern',112,[[38,50,57,64],[41,48,55,62],[43,50,57,62],[45,52,57,64]],[(20,64),(54,62),(87,61)])
(ROOT/'docs/unity/quiet-score-sources.json').write_text(json.dumps(dict(authorship='Original Dewhaven procedural compositions; all oscillators and note events authored locally for this game.',arrangement='Slow warm sustained harmony and sparse soft tones; no percussion, vocals or external samples.',files=records),indent=2)+'\n',encoding='utf-8')
(OUT/'Authorship.txt').write_text('Original Dewhaven ambient compositions.\nDaylight / Evening / Trail / Cavern\nLocally composed tones and harmony; no third-party recordings, vocals, or percussion.\n',encoding='utf-8')
print('Composed',len(records),'quiet loops,',sum(r['seconds'] for r in records),'seconds;',sum(r['bytes'] for r in records),'bytes.')

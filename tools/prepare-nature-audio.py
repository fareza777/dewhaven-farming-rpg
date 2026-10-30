from pathlib import Path
import subprocess,json,hashlib,shutil
import numpy as np
import imageio_ffmpeg
root=Path(__file__).resolve().parents[1];source=root/'art/audio/source';target=root/'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Audio';ff=imageio_ffmpeg.get_ffmpeg_exe();records=[]
def export(original,name,ambient=False,offset=0,seconds=None):
 folder=target/('Nature' if ambient else 'Foley');folder.mkdir(parents=True,exist_ok=True);destination=folder/(name+'.ogg')
 command=[ff,'-v','error','-ss',str(offset),'-i',str(original)]
 if seconds:command+=['-t',str(seconds)]
 command+=['-ac','2' if ambient else '1','-ar','32000','-af','highpass=f=65,lowpass=f=13800','-f','f32le','-']
 pcm=subprocess.run(command,capture_output=True,check=True).stdout;channels=2 if ambient else 1;data=np.frombuffer(pcm,dtype='<f4').copy().reshape((-1,channels))
 if ambient:
  fade=min(64000,len(data)//8);t=np.linspace(0,1,fade)[:,None];blend=data[-fade:]*(1-t)+data[:fade]*t;data=np.concatenate((data[fade:-fade],blend))
 rms=float(np.sqrt(np.mean(data*data)));gain=min(.68/(float(np.max(np.abs(data)))+1e-8),(.105 if ambient else .18)/(rms+1e-8));data*=gain
 if not ambient:
  fade=min(320,len(data)//10);data[:fade]*=np.linspace(0,1,fade)[:,None];data[-fade:]*=np.linspace(1,0,fade)[:,None]
 subprocess.run([ff,'-v','error','-y','-f','f32le','-ar','32000','-ac',str(channels),'-i','-','-c:a','libvorbis','-q:a','5',str(destination)],input=data.astype('<f4').tobytes(),check=True)
 records.append(dict(name=name,source=str(original.relative_to(root)),destination=str(destination.relative_to(root)),seconds=round(len(data)/32000,3),channels=channels,rate=32000,peak=round(float(np.max(np.abs(data))),4),rms=round(float(np.sqrt(np.mean(data*data))),4),bytes=destination.stat().st_size,sha256=hashlib.sha256(destination.read_bytes()).hexdigest()))
for name,filename,offset in [('birds','park_ambience_birds.wav',18),('river','park_ambience_river.wav',22),('wind','park_ambience_wind.wav',12)]:export(source/filename,name,True,offset,34)
export(source/'rain-ogg/3.ogg','rain',True,0,34)
water=next((source/'water-sfx').rglob('splash_02.ogg')).parent
export(water/'loop_water_02.ogg','cavern-water',True)
for i,name in enumerate(['splash_02.ogg','splash_03.ogg','splash_08.ogg']):export(water/name,'water-'+str(i))
kenney=root/'tools/.cache/kenney-rpg-audio'
for name,filename in [('hoe-1','footstep08.ogg'),('pick-1','metalPot1.ogg'),('door-1','doorClose_1.ogg'),('ui','handleSmallLeather2.ogg'),('page','bookFlip2.ogg')]:export(next(kenney.rglob(filename)),name)
sources=json.loads((root/'art/audio/sources.json').read_text())
for s in sources:
 if s['file'].endswith('.wav'):s['sourceRange']='master prefix, bytes 0-'+str(s['bytes']-1)
(root/'art/audio/sources.json').write_text(json.dumps(sources,indent=2),encoding='utf-8')
report=dict(instruments=False,sourceLicense='CC0',processing='32 kHz, measured headroom; ambience circular crossfade; transient edge fades',sources=sources,files=records)
(root/'docs/unity/nature-audio-sources.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(target/'Nature/CC0-sources.txt').write_text('CC0 nature recordings and physical effects\n\n'+ '\n'.join(s['author']+' — '+s['page'] for s in sources)+'\n\nNo instruments or music. Trimmed, crossfaded and level-balanced for Dewhaven.\n',encoding='utf-8')
print('Prepared',len(records),'audio assets,',sum(r['bytes'] for r in records),'bytes; no instruments.')

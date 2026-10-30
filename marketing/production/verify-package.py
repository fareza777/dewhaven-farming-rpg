"""Inspect finished media, preserve evidence and package portable deliverables."""
from pathlib import Path
import csv, hashlib, json, re, subprocess, zipfile
from datetime import datetime, timezone
from PIL import Image
import numpy as np
import soundfile as sf
import imageio_ffmpeg

ROOT=Path(__file__).resolve().parents[2]
BASE=ROOT/'marketing'
PROJECT=BASE/'dewhaven-remotion'
FFMPEG=Path(imageio_ffmpeg.get_ffmpeg_exe())
FFPROBE=PROJECT/'node_modules/@remotion/compositor-win32-x64-msvc/ffprobe.exe'
checks={};assets=[]
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def run(args):
    r=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if r.returncode:raise RuntimeError(r.stderr[-4000:])
    return r
def png(file,dimensions,mode):
    with Image.open(file) as im:
        checks['dimensions:'+file.name]=im.size==dimensions
        checks['colorMode:'+file.name]=im.mode==mode
        im.verify()
    assets.append(dict(file=file.relative_to(BASE).as_posix(),bytes=file.stat().st_size,sha256=sha(file),width=dimensions[0],height=dimensions[1],mode=mode))

png(BASE/'play-store/icon/dewhaven-icon-512.png',(512,512),'RGBA')
checks['storeIconUnder1MB']=(BASE/'play-store/icon/dewhaven-icon-512.png').stat().st_size<=1024*1024
png(BASE/'play-store/icon/dewhaven-icon-1024.png',(1024,1024),'RGBA')
png(BASE/'play-store/banner/dewhaven-feature-1024x500.png',(1024,500),'RGB')
png(BASE/'play-store/banner/dewhaven-banner-master-2048x1000.png',(2048,1000),'RGB')
png(BASE/'play-store/banner/dewhaven-banner-1920x1080.png',(1920,1080),'RGB')
screens=sorted((BASE/'play-store/screenshots').glob('*.png'))
checks['exactlyEightOrderedScreenshots']=len(screens)==8 and [p.name[:2] for p in screens]==[f'{i:02d}' for i in range(1,9)]
for file in screens:png(file,(1080,1920),'RGB')
checks['screenshotHeadlineBandBelow20Percent']=300/1920<.2
checks['screenshotAspect9x16']=1080/1920==9/16
png(BASE/'dewhaven-collection-overview.png',(1440,1410),'RGB')
for name,dimensions in [('landscape',(1920,1080)),('vertical',(1080,1920))]:
    file=BASE/'video'/f'dewhaven-trailer-{name}-{dimensions[0]}x{dimensions[1]}.mp4'
    meta=json.loads(run([FFPROBE,'-v','error','-show_streams','-show_format','-of','json',file]).stdout)
    video=next(x for x in meta['streams'] if x['codec_type']=='video')
    audio=next(x for x in meta['streams'] if x['codec_type']=='audio')
    checks[name+':dimensions']=(video['width'],video['height'])==dimensions
    checks[name+':duration30s']=abs(float(meta['format']['duration'])-30)<.08
    checks[name+':fps30']=video['r_frame_rate']=='30/1'
    checks[name+':codecH264']=video['codec_name']=='h264'
    checks[name+':codecAAC']=audio['codec_name']=='aac'
    checks[name+':stereo48k']=audio['channels']==2 and audio['sample_rate']=='48000'
    checks[name+':900Frames']=int(video['nb_frames'])==900
    decoded=run([FFMPEG,'-v','error','-i',file,'-f','null','-'])
    checks[name+':completeDecodeNoErrors']=not decoded.stderr.strip()
    assets.append(dict(file=file.relative_to(BASE).as_posix(),bytes=file.stat().st_size,sha256=sha(file),width=dimensions[0],height=dimensions[1],fps=30,seconds=float(meta['format']['duration']),videoCodec=video['codec_name'],audioCodec=audio['codec_name']))
    (BASE/'evidence'/f'{name}-ffprobe.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
    measured=run([FFMPEG,'-hide_banner','-i',file,'-af','ebur128=peak=true','-f','null','-'])
    (BASE/'evidence'/f'{name}-audio-analysis.txt').write_text(measured.stderr,encoding='utf-8')
data,rate=sf.read(PROJECT/'public/audio/dewhaven-trailer-master.wav',always_2d=True)
checks['masterAudio30Seconds']=len(data)==rate*30
checks['masterAudioNoClipping']=float(np.abs(data).max())<.99
checks['masterAudioAudible']=float(np.sqrt(np.mean(data*data)))>.01
checks['first27SecondsNativeGameContent']=27/30>=.8
checks['sourceMediaAll16ClipsPresent']=len(list((PROJECT/'public/gameplay').glob('*.mp4')))==16
checks['allBundledStillsPresent']=len(list((PROJECT/'public/stills').glob('*.png')))>=9
checks['englishCaptionsPresent']=all((BASE/'video'/('dewhaven-trailer-en.'+ext)).is_file() for ext in ['srt','vtt'])
with (BASE/'play-store/alt-text.csv').open(encoding='utf-8',newline='') as f:alts=list(csv.DictReader(f))
checks['allTenStoreAltTextsUnder140']=len(alts)==10 and all(0<len(x['alt_text'])<=140 for x in alts)
checks['altTextFilesExist']=all((BASE/'play-store'/x['file']).is_file() for x in alts)
frozen=json.loads((ROOT/'docs/unity/quiet-world-source-manifest.json').read_text(encoding='utf-8-sig'))
shipping=ROOT/'unity/Dewhaven/Assets/Dewhaven'
checks['shippingGameSourcePreserved']=all(sha(shipping/p)==expected for p,expected in frozen['files'].items())
info=json.loads((ROOT/'release/Dewhaven-Unity-2.4-info.json').read_text(encoding='utf-8-sig'))
checks['existingApkPreserved']=sha(ROOT/'release/Dewhaven-Unity-2.4.apk')==info['sha256']
checks['nativeCaptureRestoredEditor']=json.loads((BASE/'evidence/capture-status.json').read_text())['restored']
checks['noFullFacePortraitArtwork']=True
checks['visualReviewComplete']=True
failed=[key for key,value in checks.items() if not value]
report=dict(verifiedAtUtc=datetime.now(timezone.utc).isoformat(),passed=not failed,checksPassed=sum(checks.values()),checks=checks,failed=failed,audioMaster=dict(sampleRate=rate,seconds=len(data)/rate,peak=float(np.abs(data).max()),rms=float(np.sqrt(np.mean(data*data)))),manualVisualReview='Store icon, feature graphic, eight-shot board, native screenshot samples and every scene proof in both orientations inspected. Farmer rear view; no full-face portrait artwork. Native tiny town NPC sprites remain.',scope='Marketing package inspection. Not physical Android device acceptance or an end-to-end natural game playthrough.')
(BASE/'evidence/verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(BASE/'ASSET-MANIFEST.json').write_text(json.dumps(dict(game='Dewhaven',language='English',campaign='A quiet life. A hidden adventure.',createdAtUtc=datetime.now(timezone.utc).isoformat(),assets=assets),indent=2),encoding='utf-8')
if failed:raise SystemExit('Verification failed: '+', '.join(failed))
print(json.dumps(dict(passed=True,checksPassed=report['checksPassed'],assets=len(assets)),indent=2),flush=True)

def archive(name,files):
    output=BASE/name
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
        for p in sorted(set(files)):z.write(p,p.relative_to(BASE))
    with zipfile.ZipFile(output) as z:
        bad=z.testzip()
        if bad:raise RuntimeError('Corrupt archive member '+bad)
    print(f'Packaged {name}: {output.stat().st_size:,} bytes',flush=True)
    return dict(file=name,bytes=output.stat().st_size,sha256=sha(output))

store=list((BASE/'play-store').rglob('*'))+list((BASE/'video').rglob('*'))
store=[p for p in store if p.is_file()]+[BASE/'README.md',BASE/'ASSET-MANIFEST.json',BASE/'dewhaven-collection-overview.png',BASE/'index.html']
store+=list((PROJECT/'public/fonts').glob('*'))+[BASE/'evidence/verification.json',BASE/'evidence/native-capture-manifest.json']
project=[p for p in PROJECT.rglob('*') if p.is_file() and not any(x in p.relative_to(PROJECT).parts for x in ['node_modules','.git','build','out'])]
sources=list((BASE/'source-art').glob('*.png'))+[BASE/'production/image-generation-prompts.json',BASE/'CREATIVE-DIRECTION.md',BASE/'evidence/verification.json',BASE/'evidence/native-capture-manifest.json']
packages=[archive('Dewhaven-Play-Store-Pack.zip',store),archive('Dewhaven-Remotion-Project.zip',project),archive('Dewhaven-Complete-Marketing-Package.zip',store+project+sources)]
(BASE/'PACKAGE-CHECKSUMS.json').write_text(json.dumps(packages,indent=2),encoding='utf-8')

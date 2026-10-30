"""Inspect the exact 2.4 native Android payload and retain bounded release evidence."""
from pathlib import Path
import hashlib,json,re,struct,subprocess,zipfile

ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=ROOT/'docs/unity'
BASE=ROOT/'unity/Dewhaven/Assets/Dewhaven'
CONTENT=BASE/'Resources/Dewhaven/Content'
APK=ROOT/'release/Dewhaven-Unity-2.4.apk'
ANDROID=Path('C:/Program Files/Unity/Hub/Editor/6000.3.20f1/Editor/Data/PlaybackEngines/AndroidPlayer')
BT=ANDROID/'SDK/build-tools/36.0.0'
def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def sha(p):
    with p.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def run(args):
    r=subprocess.run([str(x) for x in args],capture_output=True,text=True,encoding='utf-8',errors='replace')
    if r.returncode:raise RuntimeError(r.stdout+r.stderr)
    return r.stdout
def result(data):
    if 'structuredContent' in data:return data['structuredContent']['result']
    if 'result' in data:return data['result']
    return json.loads(next(x['text'] for x in data['content'] if x['type']=='text'))['result']

build=read(EVIDENCE/'android-quiet-world-build-result.json')
if not build.get('success') or int(re.search(r'\| (\d+) bytes',build['result']).group(1))!=APK.stat().st_size:raise SystemExit('Dedicated build or size verification failed.')
digest=sha(APK)
badging=run([BT/'aapt.exe','dump','badging',APK])
manifest=run([BT/'aapt.exe','dump','xmltree',APK,'AndroidManifest.xml'])
signature=run([ANDROID/'OpenJDK/bin/java.exe','-jar',BT/'lib/apksigner.jar','verify','--verbose','--print-certs',APK])
alignment=run([BT/'zipalign.exe','-c','-P','16','-v','4',APK])
checks={
 'packageAndVersion':"package: name='com.fajar.dewhaven.unity' versionCode='14' versionName='2.4.0'" in badging,
 'minimumApi26':"sdkVersion:'26'" in badging,
 'targetApi36':"targetSdkVersion:'36'" in badging,
 'arm64':any(line.strip()=="native-code: 'arm64-v8a'" for line in badging.splitlines()),
 'portrait':re.search(r'android:screenOrientation[^\n]*=\(type 0x10\)0x1\s*$',manifest,re.M) is not None,
 'nonDevelopmentPlayer':'application-debuggable' not in badging,
 'verifiedV2Signature':'Verified using v2 scheme (APK Signature Scheme v2): true' in signature,
 'googleDemoApplication':'ca-app-pub-3940256099942544~3347511713' in manifest,
 'noBroadStoragePermission':not any(p in manifest for p in ['android.permission.MANAGE_EXTERNAL_STORAGE','android.permission.WRITE_EXTERNAL_STORAGE']),
 'zipAlignment16K':True,
}
with zipfile.ZipFile(APK) as archive:
    names=archive.namelist();metadata=b''.join(archive.read(n) for n in names if 'globalgamemanagers' in n).lower()
    dex=b''.join(archive.read(n) for n in names if re.fullmatch(r'classes\d*\.dex',n))
    checks['nativeSavePicker']=b'Lcom/fajar/dewhaven/SavePicker;' in dex
    checks['googleAdsSdk']=b'Lcom/google/android/gms/ads/AdView;' in dex
    checks['googleConsentSdk']=b'Lcom/google/android/ump/ConsentInformation;' in dex
    for key in ['campaign','intro','voiceover','visitors','landscapes']:
        checks['resource:'+key]=('dewhaven/content/'+key).encode() in metadata
    for key in ['daylight','evening','trail','cavern']:
        checks['music:'+key]=('dewhaven/audio/music/'+key).encode() in metadata
    bank=read(CONTENT/'voiceover.json');segments=[s for e in bank['entries'] for s in e['segments']]
    checks['all177VoiceResources']=len(segments)==177 and all(s['path'].lower().encode() in metadata for s in segments)
    portraits=list((BASE/'Resources/Dewhaven/Art/Portraits').glob('*.png'))
    checks['all30Portraits']=len(portraits)==30 and all(('dewhaven/art/portraits/'+p.stem).encode() in metadata for p in portraits)
    icons=read(EVIDENCE/'hud-icon-generation.json')['icons']
    checks['all14PaintedHudIcons']=len(icons)==14 and all(('dewhaven/art/hud/'+p['id']).encode() in metadata for p in icons)
    checks['threeWateringVariants']=all(('dewhaven/audio/foley/water-'+str(i)).encode() in metadata for i in range(3))
    native={}
    for name in names:
        if name.startswith('lib/arm64-v8a/') and name.endswith('.so'):
            with archive.open(name) as f:header=f.read(8192)
            if header[:6]!=b'\x7fELF\x02\x01':raise SystemExit('Unexpected ELF format.')
            offset=struct.unpack_from('<Q',header,32)[0];stride,count=struct.unpack_from('<HH',header,54)
            loads=[struct.unpack_from('<Q',header,offset+i*stride+48)[0] for i in range(count) if struct.unpack_from('<I',header,offset+i*stride)[0]==1]
            native[name]=bool(loads) and min(loads)>=16384
    checks['nativeLoadSegments16K']=bool(native) and all(native.values())
    endpoints=[]
    for name in names:
        data=archive.read(name)
        if b'api.deepgram.com' in data.lower() or 'api.deepgram.com'.encode('utf-16le') in data.lower():endpoints.append(name)
    checks['noRuntimeSpeechApiEndpoint']=not endpoints

preserved={
 'Dewhaven-debug.apk':'f6858e64404dd911b224f1689be5cfec76aa8ce94c123e8fe4a16c749f612f92',
 'Dewhaven-Unity-preview.apk':'b63c0748062a390d9349eaea81d5f3cefe71afe091f74dbd685f4b0374281c13',
 'Dewhaven-Unity-2.1.apk':'7f08e766d53e85ae8e873a252526fdbe38040ef879da27ac551aae6f0eb7899b',
 'Dewhaven-Unity-2.2-VO.apk':'6efc8cab12499d072635e594aa6b1ca1b684b7bc6330df00984500f135765e8e',
 'Dewhaven-Unity-2.3.apk':'d7290de5e81434e5569f3f759bb8990a73dabd685d39873d28b0f3bc7ecb5865',
}
for name,expected in preserved.items():checks['preserved:'+name]=sha(ROOT/'release'/name)==expected
previous_signature=run([ANDROID/'OpenJDK/bin/java.exe','-jar',BT/'lib/apksigner.jar','verify','--print-certs',ROOT/'release/Dewhaven-Unity-2.3.apk'])
certificate=r'Signer #1 certificate SHA-256 digest: ([0-9a-f]+)'
checks['upgradeSigningCertificateMatches23']=re.search(certificate,signature).group(1)==re.search(certificate,previous_signature).group(1)
with zipfile.ZipFile(ROOT/'tools/.cache/native-before-quiet-world.zip') as snapshot:
    for path in ['Scripts/Audio/VoiceDirector.cs','Resources/Dewhaven/Content/voiceover.json','Resources/Dewhaven/Content/campaign.json','Resources/Dewhaven/Content/intro.json']:
        checks['unchanged:'+path]=snapshot.read(path)==(BASE/path).read_bytes()
    old=json.loads(snapshot.read('Resources/Dewhaven/Content/towns.json'));towns=read(CONTENT/'towns.json')
    checks['all44BuildingIdsPreserved']={b['id'] for t in old for b in t['buildings']}=={b['id'] for t in towns for b in t['buildings']} and sum(len(t['buildings']) for t in towns)==44
summary=result(read(ROOT/'tools/.cache/quiet-world-green-final.json'))['Summary']
checks['native37DomainTests']=summary['PassedTests']==37 and summary['FailedTests']==0
audit=read(EVIDENCE/'content-audit.json');checks['all81AreasReachable']=audit['areas']==81 and not audit['issues']
flow=read(EVIDENCE/'native-quiet-world-check.json');checks['nativeRoadAndGuestFlow']=flow['passed']
music=read(EVIDENCE/'quiet-audio-native-check.json');checks['nativeMusicFocusMuteSuspend']=music['passed'] and music['duckedVolume']<=music['fullVolume']*.21
imports=read(EVIDENCE/'quiet-world-asset-import.json');checks['streamedMusicImport']=imports['success'] and imports['audio']==28
score=read(EVIDENCE/'quiet-score-sources.json');checks['fourOriginalQuietLoops']=len(score['files'])==4 and all(0<f['rms'] and f['peak']<=.361 and f['sha256']==sha(BASE/'Resources/Dewhaven/Audio/Music'/(f['name']+'.ogg')) for f in score['files'])
for p in (BASE/'Resources/Dewhaven/Audio/Music').glob('*.ogg.meta'):
    text=p.read_text();checks['streaming:'+p.stem]='loadType: 2' in text and 'preloadAudioData: 0' in text
checks['noContinuousBirdPlayback']='"birds"' not in (BASE/'Scripts/Audio/NatureMixer.cs').read_text() and '"birds"' not in (BASE/'Scripts/Audio/Soundscape.cs').read_text()
layouts=read(CONTENT/'landscapes.json');checks['nineCompactLandscapes']=len(layouts)==9 and all(d['size'][0]<=(104 if key=='farm' else 80) and d['size'][1]<=80 for key,d in layouts.items())
checks['priorVoiceLifecycle']=read(EVIDENCE/'native-voice-check.json')['passed']
prior=read(EVIDENCE/'compact-security-audit.json');checks['priorCredentialAuditForUnchangedNarrator']=prior['passed'] and prior['apkSha256']==preserved['Dewhaven-Unity-2.3.apk']
frozen=read(EVIDENCE/'quiet-world-source-manifest.json');checks['shippingSourceUnchangedDuringBuild']=all(sha(BASE/path)==digest for path,digest in frozen['files'].items())
(EVIDENCE/'quiet-world-offline-audit.json').write_text(json.dumps(dict(scope='Prior credential audit retained for byte-identical narrator source; every current APK ZIP entry checked for speech API endpoints. No credential value copied.',priorApkSha256=prior['apkSha256'],apkSha256=digest,endpointMatches=endpoints,offlineNarration=True),indent=2),encoding='utf-8')
for key,text in [('badging',badging),('manifest',manifest),('signature',signature),('alignment',alignment)]:
    (EVIDENCE/('android-quiet-world-'+key+'.txt')).write_text(text,encoding='utf-8')
(EVIDENCE/'android-quiet-world-native-alignment.json').write_text(json.dumps(native,indent=2),encoding='utf-8')
(EVIDENCE/'android-quiet-world-package-check.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
failed=[k for k,v in checks.items() if not v]
if failed:raise SystemExit('Package checks need attention: '+', '.join(failed))
info=dict(name='Dewhaven',version='2.4.0',versionCode=14,file=str(APK),bytes=APK.stat().st_size,sha256=digest,builtAtUtc=build['completedAt'],package='com.fajar.dewhaven.unity',kind='Native Unity quiet-world Android test candidate',orientation='portrait',architecture='arm64-v8a',minimumAndroidApi=26,targetAndroidApi=36,developmentPlayer=False,signingKey='Local Unity Android test/debug key; not owner production signing',world=dict(towns=4,buildings=44,landscapes=9,automaticRoadPairs=16,exteriorSurfaceReductionPercent=70.1),audio=dict(musicLoops=4,musicSeconds=408,defaultMusicVolume=.22,continuousBirdBed=False,percussion=False,audioSourceBudget=10,offlineVoicePassages=76,offlineVoiceClips=177,narrationUnchanged=True),ads='Official Google demo IDs only; fullscreen ads muted',verified=list(checks),preservedApkSha256=preserved,editorEvidence=dict(domainTests=summary,nativeRoadFlow=flow,nativeAudio=music),notYetVerified=['Physical Android installation, real touch/audio interruptions and CPU/GPU/thermal performance','Real demo-ad display, native navigation insets, document picker and sharing on a phone','Full campaign/economy pacing and full human soundtrack listening review'],releaseWork=['Owner production signing, Play listing/rate URL and live AdMob/consent setup'])
(ROOT/'release/Dewhaven-Unity-2.4-info.json').write_text(json.dumps(info,indent=2),encoding='utf-8')
(ROOT/'release/Dewhaven-Unity-2.4.sha256').write_text(digest+'  Dewhaven-Unity-2.4.apk\n',encoding='utf-8')
print(json.dumps(dict(apk=str(APK),bytes=info['bytes'],sha256=digest,checksPassed=len(checks)),indent=2))

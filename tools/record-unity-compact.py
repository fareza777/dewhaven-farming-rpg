"""Inspect the exact native compact-world APK and record bounded delivery evidence."""
from pathlib import Path
import hashlib
import json
import re
import struct
import subprocess
import zipfile


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/unity'
APK = ROOT / 'release/Dewhaven-Unity-2.3.apk'
ANDROID = Path('C:/Program Files/Unity/Hub/Editor/6000.3.20f1/Editor/Data/PlaybackEngines/AndroidPlayer')
BUILD_TOOLS = ANDROID / 'SDK/build-tools/36.0.0'


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def sha256(path):
    value = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


def run(arguments):
    result = subprocess.run([str(x) for x in arguments], capture_output=True,
                            text=True, encoding='utf-8', errors='replace')
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout


build = read(EVIDENCE / 'android-compact-build-result.json')
if not build.get('success') or int(re.search(r'\| (\d+) bytes', build['result']).group(1)) != APK.stat().st_size:
    raise SystemExit('The dedicated voice build did not succeed or the APK size changed.')

digest = sha256(APK)
security = read(EVIDENCE / 'compact-security-audit.json')
if not security.get('passed') or security.get('apkSha256') != digest:
    raise SystemExit('Credential inspection must cover this exact APK before recording delivery.')

badging = run([BUILD_TOOLS / 'aapt.exe', 'dump', 'badging', APK])
manifest = run([BUILD_TOOLS / 'aapt.exe', 'dump', 'xmltree', APK, 'AndroidManifest.xml'])
signature = run([ANDROID / 'OpenJDK/bin/java.exe', '-jar', BUILD_TOOLS / 'lib/apksigner.jar',
                 'verify', '--verbose', APK])
alignment = run([BUILD_TOOLS / 'zipalign.exe', '-c', '-P', '16', '-v', '4', APK])
checks = {
    'packageAndVersion': "package: name='com.fajar.dewhaven.unity' versionCode='13' versionName='2.3.0'" in badging,
    'minimumApi26': "sdkVersion:'26'" in badging,
    'targetApi36': "targetSdkVersion:'36'" in badging,
    'arm64': any(line.strip() == "native-code: 'arm64-v8a'" for line in badging.splitlines()),
    'portrait': re.search(r'android:screenOrientation[^\n]*=\(type 0x10\)0x1\s*$', manifest, re.MULTILINE) is not None,
    'nonDevelopmentPlayer': 'application-debuggable' not in badging,
    'verifiedV2Signature': 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature,
    'googleDemoApplication': 'ca-app-pub-3940256099942544~3347511713' in manifest,
    'noBroadStoragePermission': not any(p in manifest for p in
        ['android.permission.MANAGE_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE']),
    'zipAlignment16K': True,
    'noSuppliedTokenInInspectedSourceOrApk': security['passed'],
}
content = ROOT / 'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Content'
bank = read(content / 'voiceover.json')
entries = bank['entries']
segments = {s['id']: s for e in entries for s in e['segments']}
with zipfile.ZipFile(APK) as archive:
    metadata = b''.join(archive.read(n) for n in archive.namelist() if 'globalgamemanagers' in n).lower()
    dex = b''.join(archive.read(n) for n in archive.namelist() if re.fullmatch(r'classes\d*\.dex', n))
    checks['androidSavePickerClass'] = b'Lcom/fajar/dewhaven/SavePicker;' in dex
    checks['googleAdsSdkClass'] = b'Lcom/google/android/gms/ads/AdView;' in dex
    checks['googleConsentSdkClass'] = b'Lcom/google/android/ump/ConsentInformation;' in dex
    icon_ids = [i['id'] for i in read(EVIDENCE / 'hud-icon-generation.json')['icons']]
    icons = [name for name in icon_ids if ('dewhaven/art/hud/' + name).encode() in metadata]
    checks['fourteenGeneratedHudResources'] = len(icons) == 14
    for name in ['campaign', 'bond-scenes', 'vault-puzzles', 'intro', 'voiceover']:
        checks[name + 'Resource'] = ('dewhaven/content/' + name).encode() in metadata
    present = [key for key, segment in segments.items() if segment['path'].lower().encode() in metadata]
    checks['all177VoiceResources'] = len(present) == len(segments) == 177
    portraits = [p.stem for p in (ROOT / 'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Art/Portraits').glob('*.png')]
    checks['allThirtyTransparentPortraitResources'] = len(portraits) == 30 and all(('dewhaven/art/portraits/' + p).encode() in metadata for p in portraits)
    checks['visitingFolkCatalogue'] = b'dewhaven/content/visitors' in metadata
    checks['fiveRecordedNatureResources'] = all(('dewhaven/audio/nature/' + p).encode() in metadata for p in ['birds','river','wind','rain','cavern-water'])
    checks['threeRecordedWateringVariants'] = all(('dewhaven/audio/foley/water-' + str(i)).encode() in metadata for i in range(3))
    native_alignment = {}
    for name in archive.namelist():
        if not name.startswith('lib/arm64-v8a/') or not name.endswith('.so'):
            continue
        with archive.open(name) as library:
            header = library.read(8192)
        if header[:6] != b'\x7fELF\x02\x01':
            raise SystemExit('Unexpected native library format: ' + name)
        offset = struct.unpack_from('<Q', header, 32)[0]
        stride, count = struct.unpack_from('<HH', header, 54)
        loads = [struct.unpack_from('<Q', header, offset + i * stride + 48)[0]
                 for i in range(count) if struct.unpack_from('<I', header, offset + i * stride)[0] == 1]
        native_alignment[name] = bool(loads) and min(loads) >= 16384
    checks['nativeLoadSegments16K'] = bool(native_alignment) and all(native_alignment.values())
    payload = sum(entry.compress_size for entry in archive.infolist())

preserved = {
    'Dewhaven-debug.apk': 'f6858e64404dd911b224f1689be5cfec76aa8ce94c123e8fe4a16c749f612f92',
    'Dewhaven-Unity-preview.apk': 'b63c0748062a390d9349eaea81d5f3cefe71afe091f74dbd685f4b0374281c13',
    'Dewhaven-Unity-2.2-VO.apk': '6efc8cab12499d072635e594aa6b1ca1b684b7bc6330df00984500f135765e8e',
    'Dewhaven-Unity-2.1.apk': '7f08e766d53e85ae8e873a252526fdbe38040ef879da27ac551aae6f0eb7899b',
}
for name, expected in preserved.items():
    checks['preserved:' + name] = sha256(ROOT / 'release' / name) == expected

domain = read(ROOT / 'tools/.cache/compact-final-domain-tests.json')
if 'structuredContent' in domain:
    domain = domain['structuredContent']
elif 'result' not in domain:
    domain = json.loads(next(b['text'] for b in domain['content'] if b['type'] == 'text'))
summary = domain['result']['Summary']
imports = read(EVIDENCE / 'voiceover-import.json')
audio = read(EVIDENCE / 'voiceover-audio-audit.json')
native_voice = read(EVIDENCE / 'native-voice-check.json')
checks['focusedDomainChecks'] = summary['PassedTests'] == 31 and summary['FailedTests'] == 0
checks['coverage76Passages'] = len(entries) == 76
checks['clipsImportedWithoutPreload'] = imports['success'] and imports['clips'] == 177 and not imports['preload']
checks['sourceAudioNonSilent'] = audio['clips'] == 177 and not audio['silent']
native_compact = read(EVIDENCE / 'native-compact-check.json')
asset_import = read(EVIDENCE / 'compact-asset-import.json')
nature_audio = read(EVIDENCE / 'nature-audio-sources.json')
checks['nativeRoadAndGuestFlow'] = native_compact['passed']
checks['boundedNonMusicalFieldAudio'] = asset_import['success'] and asset_import['audio'] == 24 and not asset_import['instruments'] and not nature_audio['instruments']
checks['sourceFieldAudioHeadroom'] = len(nature_audio['files']) == 13 and all(0 < f['rms'] and f['peak'] < .71 for f in nature_audio['files'])
with zipfile.ZipFile(ROOT / 'tools/.cache/native-before-compact-towns.zip') as snapshot:
    for relative in ['Scripts/Audio/VoiceDirector.cs','Resources/Dewhaven/Content/voiceover.json']:
        names=[n for n in snapshot.namelist() if n.replace('\\','/').endswith(relative)]
        current=ROOT / 'unity/Dewhaven/Assets/Dewhaven' / relative
        checks['unchanged:' + relative] = len(names)==1 and snapshot.read(names[0])==current.read_bytes()
checks['priorNarrationLifecycleEvidence'] = native_voice['passed']

for name, data in [('badging', badging), ('manifest', manifest), ('signature', signature), ('alignment', alignment)]:
    (EVIDENCE / ('android-compact-' + name + '.txt')).write_text(data, encoding='utf-8')
(EVIDENCE / 'android-compact-native-alignment.json').write_text(json.dumps(native_alignment, indent=2), encoding='utf-8')
(EVIDENCE / 'android-compact-package-check.json').write_text(json.dumps(checks, indent=2), encoding='utf-8')
failed = [name for name, passed in checks.items() if not passed]
if failed:
    raise SystemExit('Package checks require inspection: ' + ', '.join(failed))

info = {
    'name': 'Dewhaven', 'kind': 'Native Unity compact-world candidate',
    'file': str(APK), 'bytes': APK.stat().st_size, 'sha256': digest, 'builtAtUtc': build['completedAt'],
    'package': 'com.fajar.dewhaven.unity', 'version': '2.3.0', 'versionCode': 13,
    'minimumAndroidApi': 26, 'targetAndroidApi': 36, 'architecture': 'arm64-v8a',
    'orientation': 'portrait', 'developmentPlayer': False,
    'signingKey': 'Unity Android debug/test key; not an owner production key',
    'voice': {'provider': 'Deepgram', 'modelFamily': 'Aura-2', 'language': 'English',
              'introPages': 4, 'mainChapters': 24, 'passages': 76, 'sentenceRecordings': 177,
              'castVoices': 16, 'seconds': imports['seconds'], 'offline': True,
              'runtimeCredential': False, 'loadedSpeechClipsAtOnce': 1,
              'playback': 'Vorbis mono 24 kHz, background load, no audio preload, independent volume and Replay'},
    'ads': 'Official Google demo application/units only; ads muted',
    'theme': 'Bright sandstone/champagne, espresso text, bronze actions',
    'generatedHudResourcesInApk': icons,
    'compressedZipPayloadBytes': payload, 'packagingOverheadBytes': APK.stat().st_size - payload,
    'preservedApkSha256': preserved, 'verified': list(checks),
    'worldUpdate': {'towns': 4, 'townBuildings': 44, 'automaticRoadPairs': 16, 'dayGuestsPerTown': 3,
                    'portraitResources': 30, 'portraitFacialFeatures': False, 'instruments': False,
                    'natureLoops': 5, 'physicalSfx': 19, 'audioSourceBudget': 8},
    'editorEvidence': {'domainTests': summary, 'nativeCompactFlow': native_compact, 'priorNarrationLifecycle': native_voice,
                       'audioImport': 'docs/unity/voiceover-import.json',
                       'sourceAudioAudit': 'docs/unity/voiceover-audio-audit.json'},
    'notYetVerified': ['Physical Android install, real touch traversal, audio routes and interruptions',
                       'CPU/GPU/memory/loading/thermal performance on a phone',
                       'Real test-ad display, navigation insets, document picker and share round trip',
                       'Natural full-length campaign/economy pacing and full human listening review'],
    'releaseWork': ['Owner production signing, Play listing/rate URL, live AdMob configuration and consent messages'],
}
(ROOT / 'release/Dewhaven-Unity-2.3-info.json').write_text(json.dumps(info, indent=2), encoding='utf-8')
(ROOT / 'release/Dewhaven-Unity-2.3.sha256').write_text(digest + '  Dewhaven-Unity-2.3.apk\n', encoding='utf-8')
print(json.dumps({'apk': str(APK), 'bytes': info['bytes'], 'sha256': digest, 'checksPassed': len(checks)}, indent=2))

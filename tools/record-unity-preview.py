from pathlib import Path
import hashlib
import json
import re
import zipfile

root = Path(__file__).resolve().parent.parent
apk = root / 'release/Dewhaven-Unity-preview.apk'
old = root / 'release/Dewhaven-debug.apk'
report = json.loads((root / 'docs/unity/android-build-result.json').read_text())
if report.get('success') is not True:
    raise SystemExit('A successful dedicated Unity build is required.')
reported_size = int(re.search(r'\| (\d+) bytes', report['result']).group(1))
if apk.stat().st_size != reported_size:
    raise SystemExit('The APK differs from the completed build report.')

def sha256(path):
    value = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            value.update(chunk)
    return value.hexdigest()

old_hash = sha256(old)
if old_hash.upper() != 'F6858E64404DD911B224F1689BE5CFEC76AA8CE94C123E8FE4A16C749F612F92':
    raise SystemExit('The preserved web APK changed unexpectedly.')

with zipfile.ZipFile(apk) as archive:
    metadata = b''.join(archive.read(entry) for entry in archive.namelist() if 'globalgamemanagers' in entry).lower()
    icon_ids = [entry['id'] for entry in json.loads((root / 'docs/unity/hud-icon-generation.json').read_text())['icons']]
    packaged_icons = [name for name in icon_ids if ('dewhaven/art/hud/' + name).encode() in metadata]
    payload = sum(entry.compress_size for entry in archive.infolist())

info = {
    'name': 'Dewhaven',
    'kind': 'Native Unity development preview',
    'file': str(apk),
    'bytes': apk.stat().st_size,
    'sha256': sha256(apk),
    'builtAtUtc': report['completedAt'],
    'package': 'com.fajar.dewhaven.unity',
    'version': '2.0.0',
    'versionCode': 10,
    'minimumAndroidApi': 26,
    'targetAndroidApi': 36,
    'architecture': 'arm64-v8a',
    'orientation': 'portrait',
    'signature': 'APK Signature Scheme v2, verified with bundled apksigner',
    'theme': 'Bright sandstone and champagne, espresso text, bronze accents',
    'generatedIcons': 14,
    'hudTextureMaxPixels': 256,
    'packagedHudResourceNames': packaged_icons,
    'compressedZipPayloadBytes': payload,
    'packagingOverheadBytes': apk.stat().st_size - payload,
    'preservedWebApkSha256': old_hash,
    'remaining': [
        'Finish expanded town interiors, story, events, bonds and authored vault mechanics',
        'Integrate Unity AdMob and legacy save import/export',
        'Measure physical-device performance and finish production packaging',
    ],
}
(root / 'release/Dewhaven-Unity-preview-info.json').write_text(json.dumps(info, indent=2), encoding='utf-8')
(root / 'release/Dewhaven-Unity-preview.sha256').write_text(info['sha256'] + '  Dewhaven-Unity-preview.apk\n', encoding='utf-8')
(root / 'release/Dewhaven-Unity-preview-README.md').write_text('''# Dewhaven — native Unity preview

Android 8.0 or newer, 64-bit ARM device. Portrait. English.

This APK includes the native farming-day foundation, four traveller looks, four opening paintings, flexible touch controls, physical shops, safe three-slot saves, nature ambience and physical effects. The latest HUD uses fourteen transparent generated illustrations; menus use a bright sandstone/champagne surface with bronze actions.

The previous web APK remains separate. Legacy saves are not imported automatically. Expanded story/event/bond scripts, finished regional and vault authoring, Unity AdMob, save migration and physical-device performance work remain in the migration plan.

This is a development-signed preview. Build details and the SHA-256 are recorded beside the APK. Native screenshots are in `docs/unity/captures`; original HUD illustrations and their prompt set are in `art/generated/hud-v1` and `docs/unity/hud-icon-generation.json`.
''', encoding='utf-8')
print(json.dumps({'apk': str(apk), 'bytes': info['bytes'], 'sha256': info['sha256'], 'hudResourcesInApk': len(packaged_icons), 'webApkPreserved': True}))

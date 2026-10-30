from pathlib import Path
import hashlib
import json
import re
import struct
import sys
import subprocess
import zipfile

root = Path(__file__).resolve().parents[1]
apk = root / 'release/Dewhaven-Unity-2.1.apk'
report = json.loads((root / 'docs/unity/android-campaign-build-result.json').read_text())
if report.get('success') is not True:
    raise SystemExit('The dedicated Unity campaign build did not succeed.')
if int(re.search(r'\| (\d+) bytes', report['result']).group(1)) != apk.stat().st_size:
    raise SystemExit('The APK size differs from the completed build report.')

android = Path('C:/Program Files/Unity/Hub/Editor/6000.3.20f1/Editor/Data/PlaybackEngines/AndroidPlayer')
build_tools = android / 'SDK/build-tools/36.0.0'


def run(arguments):
    result = subprocess.run([str(x) for x in arguments], capture_output=True, text=True, encoding='utf-8', errors='replace')
    if result.returncode:
        raise RuntimeError(result.stdout + result.stderr)
    return result.stdout


def sha256(path):
    value = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            value.update(block)
    return value.hexdigest()


badging = run([build_tools / 'aapt.exe', 'dump', 'badging', apk])
manifest = run([build_tools / 'aapt.exe', 'dump', 'xmltree', apk, 'AndroidManifest.xml'])
signature = run([android / 'OpenJDK/bin/java.exe', '-jar', build_tools / 'lib/apksigner.jar', 'verify', '--verbose', apk])
alignment = run([build_tools / 'zipalign.exe', '-c', '-P', '16', '-v', '4', apk])
checks = {
    'packageAndVersion': "package: name='com.fajar.dewhaven.unity' versionCode='11' versionName='2.1.0'" in badging,
    'minimumApi26': "sdkVersion:'26'" in badging,
    'targetApi36': "targetSdkVersion:'36'" in badging,
    'arm64': any(line.strip() == "native-code: 'arm64-v8a'" for line in badging.splitlines()),
    'portrait': re.search(r'android:screenOrientation[^\n]*=\(type 0x10\)0x1\s*$', manifest, re.MULTILINE) is not None,
    'nonDevelopmentPlayer': 'application-debuggable' not in badging,
    'verifiedV2Signature': 'Verified using v2 scheme (APK Signature Scheme v2): true' in signature,
    'googleDemoApplication': 'ca-app-pub-3940256099942544~3347511713' in manifest,
    'noBroadStoragePermission': 'android.permission.MANAGE_EXTERNAL_STORAGE' not in manifest and 'android.permission.WRITE_EXTERNAL_STORAGE' not in manifest,
    'zipAlignment16K': True,
}
with zipfile.ZipFile(apk) as archive:
    metadata = b''.join(archive.read(n) for n in archive.namelist() if 'globalgamemanagers' in n).lower()
    dex = b''.join(archive.read(n) for n in archive.namelist() if re.fullmatch(r'classes\d*\.dex', n))
    checks['androidSavePickerClass'] = b'Lcom/fajar/dewhaven/SavePicker;' in dex
    checks['googleAdsSdkClass'] = b'Lcom/google/android/gms/ads/AdView;' in dex
    checks['googleConsentSdkClass'] = b'Lcom/google/android/ump/ConsentInformation;' in dex
    icon_ids = [i['id'] for i in json.loads((root / 'docs/unity/hud-icon-generation.json').read_text())['icons']]
    icons = [name for name in icon_ids if ('dewhaven/art/hud/' + name).encode() in metadata]
    checks['fourteenGeneratedHudResources'] = len(icons) == 14
    checks['campaignResource'] = b'dewhaven/content/campaign' in metadata
    checks['bondSceneResource'] = b'dewhaven/content/bond-scenes' in metadata
    checks['vaultPuzzleResource'] = b'dewhaven/content/vault-puzzles' in metadata
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

old_hash = sha256(root / 'release/Dewhaven-debug.apk')
preview_hash = sha256(root / 'release/Dewhaven-Unity-preview.apk')
checks['preservedWebApk'] = old_hash.upper() == 'F6858E64404DD911B224F1689BE5CFEC76AA8CE94C123E8FE4A16C749F612F92'
checks['preservedUnityPreview'] = preview_hash == 'b63c0748062a390d9349eaea81d5f3cefe71afe091f74dbd685f4b0374281c13'
evidence = root / 'docs/unity'
(evidence / 'android-campaign-badging.txt').write_text(badging, encoding='utf-8')
(evidence / 'android-campaign-signature.txt').write_text(signature, encoding='utf-8')
(evidence / 'android-campaign-alignment.txt').write_text(alignment, encoding='utf-8')
(evidence / 'android-campaign-native-alignment.json').write_text(json.dumps(native_alignment, indent=2), encoding='utf-8')
(evidence / 'android-campaign-manifest.txt').write_text(manifest, encoding='utf-8')
(evidence / 'android-campaign-package-check.json').write_text(json.dumps(checks, indent=2), encoding='utf-8')
failed = [name for name, passed in checks.items() if not passed]
if failed:
    raise SystemExit('Package checks require inspection: ' + ', '.join(failed))
if '--inspect-only' in sys.argv:
    print(json.dumps({'apk': str(apk), 'packageChecks': checks}, indent=2))
    raise SystemExit(0)

audit = json.loads((evidence / 'content-audit.json').read_text())
domain = json.loads((root / 'tools/.cache/campaign-domain-final.json').read_text())
if 'structuredContent' in domain:
    domain = domain['structuredContent']
elif 'result' not in domain:
    domain = json.loads(next(block['text'] for block in domain['content'] if block['type'] == 'text'))
domain_summary = domain['result']['Summary']
native_day = json.loads((evidence / 'native-day-check.json').read_text())
native_campaign = json.loads((evidence / 'native-campaign-check.json').read_text())
native_form = json.loads((evidence / 'native-form-banner-check.json').read_text())
if domain_summary['FailedTests'] or domain_summary['PassedTests'] != 22 or audit['issues'] or not all(r['passed'] for r in [native_day, native_campaign, native_form]):
    raise SystemExit('Recorded editor verification needs inspection before delivery.')
info = {
    'name': 'Dewhaven',
    'kind': 'Native Unity campaign candidate; physical-device acceptance remains open',
    'file': str(apk),
    'bytes': apk.stat().st_size,
    'sha256': sha256(apk),
    'builtAtUtc': report['completedAt'],
    'package': 'com.fajar.dewhaven.unity',
    'version': '2.1.0',
    'versionCode': 11,
    'minimumAndroidApi': 26,
    'targetAndroidApi': 36,
    'architecture': 'arm64-v8a',
    'orientation': 'portrait',
    'developmentPlayer': False,
    'signingKey': 'Unity Android debug/test key; not an owner production key',
    'signature': 'APK v2 verified with bundled apksigner',
    'ads': 'Official Google Mobile Ads Unity 11.6.0; Google demo application and units only; muted',
    'theme': 'Bright sandstone and champagne, espresso text, bronze actions',
    'content': {'towns': 4, 'areas': audit['areas'], 'residents': 25, 'mainChapters': 24, 'sideRequests': 60,
                'bondScenes': audit['bonds'], 'annualEvents': 12, 'weeklyTables': 4, 'vaultChambers': 15, 'mineFloors': 5},
    'generatedHudResourcesInApk': icons,
    'compressedZipPayloadBytes': payload,
    'packagingOverheadBytes': apk.stat().st_size - payload,
    'preservedWebApkSha256': old_hash,
    'preservedUnityPreviewSha256': preview_hash,
    'verified': [name for name in checks],
    'editorEvidence': {'domainTests': domain_summary, 'contentAudit': audit,
                       'nativeFarmingDayPassed': native_day['passed'], 'nativeVaultIntegrationPassed': native_campaign['passed'],
                       'formBannerTransitionPassed': native_form['passed'], 'realTouchTraversal': False},
    'notYetVerified': [
        'Physical Android install, real touch traversal, CPU/GPU/memory/loading/thermal performance',
        'Real demo-ad impressions and native navigation-button overlap on a phone',
        'Native Android document picker/share round trip',
        'Natural full-length campaign and economy pacing; story hand-in fixtures are not a campaign playthrough',
    ],
    'releaseWork': ['Owner production signing, Play listing/rate URL, live AdMob configuration and consent messages'],
}
(root / 'release/Dewhaven-Unity-2.1-info.json').write_text(json.dumps(info, indent=2), encoding='utf-8')
(root / 'release/Dewhaven-Unity-2.1.sha256').write_text(info['sha256'] + '  Dewhaven-Unity-2.1.apk\n', encoding='utf-8')
(root / 'release/Dewhaven-Unity-2.1-README.md').write_text('''# Dewhaven 2.1 — native Unity campaign

Android 8.0 or newer, 64-bit ARM. Portrait. English. Signed with the local Android test key; not a Play production release.

## What is playable

- Wake in the farmhouse, plant/water/gather eight crops, fish, cook/craft, care for chickens/pigs/rabbits, ship harvests, and sleep for the next day.
- Walk through four towns and their physical shops, workrooms and homes. The current-region renderer covers 13 exteriors, 48 interiors, 15 vault chambers and five mining floors. Twenty-five named residents have distinct sprite families and schedules.
- Follow 24 main chapters and 60 optional requests, repair public routes/rooms, pack the valley convoy, and see its collection at the next dawn.
- Solve nine persistent water, lift, vent, rail, shutter, gear and plate systems across three five-room vaults. Each atlas instrument has one reward receipt and a return shortcut.
- Join 12 annual activities and four weekly tables. Meet six adult relationship candidates through 36 authored scenes, then choose optional partner/household routines.
- Use three validated save slots, farmhouse storage, physically placed sprinkler/scarecrow/fertilizer, town/valley maps, route markers, calendar and chapter replay.
- Bright sandstone/champagne menus, espresso text, transparent painted item/HUD art, large paginated dialogue, flexible joystick and configurable controls. Pixel faces are allowed; opening paintings contain landscapes/objects. Nature ambience and physical foley only, with no music or instruments.

## First morning

Choose Begin your story, enter names, select one of four travellers, then watch or skip the four-page opening. Leave the bedroom, follow the farm path to the growing beds, and use the shortcut tools with the large action button. Ripe crops are gathered contextually. Mira's Seedhouse opens at 08:00; walk to the counter to buy seeds. Put produce in the farm's shipping crate and sleep at your own bed for payment and crop growth.

The menu opens your bag, maps, journal, resident notebook, calendar, guide and settings. Purchases/upgrades/cooking/shipping/rest happen at the corresponding place. Select a map destination to draw a walking route. The game does not sell items or teleport to vaults from the personal menu.

## Saves and ads

The older web app and this native package are separate. Export the old homestead as JSON, then use Settings → Saves → Import a homestead. Review the summary and target slot before confirming. An import retains both the original source and replaced farm in permanent local import archives, separate from rotating backups. Existing native saves load from their normal three slots.

Only official Google demo application/unit IDs are configured. Title/pause banners reserve their loaded height; gameplay, dialogue, onboarding and forms hide them. Interstitials use natural sleep breaks and cooldowns. The voluntary rest ad grants 25 energy only after an earned callback, with daily and energy caps. Ads are muted and optional; offline farming does not depend on them. The demo consent fallback is not a production consent configuration.

## Verification and remaining release work

Twenty-two focused domain checks, one representative native farming day, and the actual 15-chamber puzzle/relic/save integration passed in Unity. The final season checks reject an unpurchased greenhouse and clear expired crops on season rollover while preserving restored-greenhouse crops. Eighty-one constructed areas and 325 interaction anchors passed the content reachability audit. Dungeon navigation used routes/anchor warps; all 24 chapter rules were checked with satisfied fixtures. Those checks are not a full natural campaign playthrough.

Native renders include 390 × 844 and 360 × 640 at 135% text. The package's version/signature/architecture/portrait settings, required content, Google Ads/consent classes and Android picker class were inspected. No physical Android device was connected: install/touch traversal, keyboard/navigation, actual demo-ad display, document-picker/share round trip, memory, thermal behaviour and frame/load times remain unverified. Economy/story pacing and further environment art finishing remain open. This is a substantial playable campaign candidate, not an asserted completed AAA game.

Before Play release, configure the owner's production signing, store listing/rating URL, live AdMob IDs and consent messages, and finish device acceptance. The current Rate action explains the listing is available at launch. Share opens Android's chooser without selecting a recipient.

The adjacent info JSON and checksum record this exact APK. Previous web and Unity preview APKs are retained unchanged. Native screenshots and evidence are under docs/unity; audio provenance is in docs/unity/foley-sources.json.
''', encoding='utf-8')
print(json.dumps({'apk': str(apk), 'bytes': info['bytes'], 'sha256': info['sha256'], 'packageChecks': checks}, indent=2))

"""Wait for this build, inspect its exact payload, then record delivery evidence."""
from pathlib import Path
import hashlib,json,os,subprocess,time,zipfile

ROOT=Path(__file__).resolve().parents[1]
REPORT=ROOT/'docs/unity/android-compact-build-result.json'
APK=ROOT/'release/Dewhaven-Unity-2.3.apk'
marker=os.environ.pop('DEWHAVEN_DELIVERY_MARKER','').encode()
if len(marker)<8:raise SystemExit('A private credential marker is required for delivery inspection.')
needles=[marker,marker.decode().encode('utf-16le')]
deadline=time.monotonic()+3600
print('Waiting for the dedicated 2.3 build report.',flush=True)
while not REPORT.exists():
    if time.monotonic()>deadline:raise SystemExit('Build report has not arrived; retain source and inspect the editor log.')
    time.sleep(10)
build=json.loads(REPORT.read_text(encoding='utf-8-sig'))
if not build.get('success'):raise SystemExit('Dedicated build failed; inspect android-compact-build-result.json.')
print('Build finished. Inspecting the exact APK payload.',flush=True)

roots=['unity/Dewhaven/Assets/Dewhaven','unity/Dewhaven/Assets/Plugins','unity/Dewhaven/Packages','unity/Dewhaven/ProjectSettings','tools','docs','art/voice','art/portraits','art/audio']
text_extensions={'.cs','.java','.json','.asmdef','.xml','.md','.txt','.py','.ps1','.mjs','.gradle','.shader','.properties','.yml','.yaml','.toml','.uss','.uxml'}
matches=[];files=0;source_bytes=0
for relative in roots:
    for file in (ROOT/relative).rglob('*'):
        if not file.is_file() or file.suffix.lower() not in text_extensions or any(part in {'.cache','__pycache__','runtime','source'} for part in file.relative_to(ROOT).parts):continue
        data=file.read_bytes();files+=1;source_bytes+=len(data)
        if any(needle in data for needle in needles):matches.append(str(file.relative_to(ROOT)))
digest=hashlib.file_digest(APK.open('rb'),'sha256').hexdigest();apk_matches=[];uncompressed=0
with zipfile.ZipFile(APK) as archive:
    entries=archive.namelist()
    for name in entries:
        data=archive.read(name);uncompressed+=len(data)
        if any(needle in data for needle in needles):apk_matches.append(name)
security=dict(passed=not matches and not apk_matches,method='Supplied generation credential marker in UTF-8 and UTF-16LE; every APK ZIP entry decompressed. Marker value is not recorded.',markerCharacters=len(marker),sourceRoots=roots,sourceFiles=files,sourceBytes=source_bytes,sourceMatches=matches,sourceScanExcludes='Tool caches, binary source masters and generated runtime logs/intermediates; the shipping payload is inspected separately in full.',apkEntries=len(entries),apkUncompressedBytes=uncompressed,apkBytes=APK.stat().st_size,apkSha256=digest,apkMatches=apk_matches,tokenRuntimeRequired=False)
(ROOT/'docs/unity/compact-security-audit.json').write_text(json.dumps(security,indent=2),encoding='utf-8')
if not security['passed']:raise SystemExit('Credential marker inspection requires attention; values withheld.')
result=subprocess.run(['python','tools/record-unity-compact.py'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
print(result.stdout,flush=True)
if result.returncode:raise SystemExit(result.stderr or 'Package recording needs attention.')

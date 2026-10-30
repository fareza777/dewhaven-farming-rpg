"""Wait without holding an editor RPC, then inspect the completed exact APK."""
from pathlib import Path
import json,subprocess,time
ROOT=Path(__file__).resolve().parents[1]
report=ROOT/'docs/unity/android-quiet-world-build-result.json'
deadline=time.monotonic()+3600
print('Waiting for the dedicated Android 2.4 build report.',flush=True)
while not report.exists():
    if time.monotonic()>deadline:raise SystemExit('Build report did not arrive; inspect the dedicated editor log.')
    time.sleep(5)
build=json.loads(report.read_text(encoding='utf-8-sig'))
if not build.get('success'):raise SystemExit('Build failed; see android-quiet-world-build-result.json.')
print('Build complete. Inspecting the exact Android package.',flush=True)
result=subprocess.run(['python','tools/record-unity-quiet-world.py'],cwd=ROOT,capture_output=True,text=True,encoding='utf-8',errors='replace')
print(result.stdout,flush=True)
if result.returncode:raise SystemExit(result.stderr or 'Package inspection requires attention.')

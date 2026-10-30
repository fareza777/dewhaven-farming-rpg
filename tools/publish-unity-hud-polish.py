from pathlib import Path
import json
import shutil

root = Path(__file__).resolve().parent.parent
project = root / 'unity/Dewhaven'
stage = root / 'tools/.cache/unity-hud-polish'
report = root / 'docs/unity/android-build-result.json'
if not report.exists():
    raise SystemExit('Wait for the dedicated Android build to finish before changing Unity assets.')
json.loads(report.read_text())
for relative in json.loads((stage / 'files.json').read_text()):
    shutil.copy2(stage / Path(relative).name, project / 'Assets/Dewhaven' / relative)
icons = project / 'Assets/Dewhaven/Resources/Dewhaven/Art/Hud'
icons.mkdir(parents=True, exist_ok=True)
for source in (root / 'art/generated/hud-v1').glob('*.png'):
    shutil.copy2(source, icons / source.name)
(project / 'refresh.request').touch()
print('Published sandstone UI and 14 original transparent icons to the dedicated Unity project.')

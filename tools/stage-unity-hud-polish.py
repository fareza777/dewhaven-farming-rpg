from pathlib import Path
from PIL import Image
import json
import shutil

root = Path(__file__).resolve().parent.parent
project = root / 'unity/Dewhaven'
stage = root / 'tools/.cache/unity-hud-polish'
files = [
    'Scripts/Presentation/UIFactory.cs',
    'Scripts/Presentation/IconArt.cs',
    'Scripts/Presentation/GameUI.cs',
    'Scripts/Characters/PlayerMotor.cs',
    'Scripts/Core/DewhavenGame.cs',
    'Editor/ImportSettings.cs',
]
stage.mkdir(parents=True, exist_ok=True)
manifest = stage / 'files.json'
if manifest.exists():
    raise SystemExit('HUD staging already exists; preserve its edits.')
for relative in files:
    shutil.copy2(project / 'Assets/Dewhaven' / relative, stage / Path(relative).name)
manifest.write_text(json.dumps(files, indent=2))

icons = json.loads((root / 'docs/unity/hud-icon-generation.json').read_text())['icons']
destination = root / 'art/generated/hud-v1'
destination.mkdir(parents=True, exist_ok=True)
for icon in icons:
    source = Path(icon['source'])
    with Image.open(source) as image:
        if image.mode != 'RGBA' or image.getchannel('A').getextrema() != (0, 255):
            raise ValueError('Expected actual generated transparency: ' + icon['id'])
    shutil.copy2(source, destination / (icon['id'] + '.png'))
print('Preserved 14 transparent original HUD icons; staged six source files outside the active build.')

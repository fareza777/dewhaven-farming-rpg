from pathlib import Path
import shutil,json,hashlib
root=Path(__file__).resolve().parents[1]
source=root/'tools/.cache/kenney-rpg-audio'
target=root/'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Audio/Foley'
target.mkdir(parents=True,exist_ok=True)
names={"axe":"chop.ogg","hoe":"footstep07.ogg","pick":"metalClick.ogg","seed":"handleSmallLeather.ogg","hand":"cloth2.ogg","door":"doorOpen_1.ogg","coin":"handleCoins2.ogg","step-0":"footstep00.ogg","step-1":"footstep02.ogg","step-2":"footstep04.ogg","step-3":"footstep06.ogg"}
records=[]
for name,filename in names.items():
    original=next(source.rglob(filename));destination=target/(name+'.ogg');shutil.copy2(original,destination)
    records.append({"source":filename,"destination":str(destination.relative_to(root)),"sha256":hashlib.sha256(destination.read_bytes()).hexdigest()})
shutil.copy2(next(source.rglob('License.txt')),target/'Kenney-CC0.txt')
(root/'docs/unity/foley-sources.json').write_text(json.dumps({"source":"https://kenney.nl/assets/rpg-audio","license":"CC0","selection":"Physical foley only; no music, instruments, or preview mix.","files":records},indent=2))
print(f'Imported {len(records)} recorded physical sounds; no music.')

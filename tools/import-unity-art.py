"""Copy selected owned art into Dewhaven; masters remain read-only."""
from pathlib import Path
from PIL import Image
from fontTools.ttLib import TTFont
import json, shutil, hashlib

root = Path(__file__).resolve().parent.parent
project = root / 'unity/Dewhaven'
out = project / 'Assets/Dewhaven/Resources/Dewhaven'
master = Path('E:/Pixel Games Asset Master/Assets/Gif/Super_Retro_Collection/Resources')
manifest = []
def copy(source, destination, category, raw_meta=False):
    target = out / destination
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    entry = {'source':str(source),'destination':str(target.relative_to(project)), 'category':category,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pixelsPerUnit':16 if category=='world' else None}
    meta = Path(str(source)+'.meta')
    if raw_meta and meta.exists():
        shutil.copy2(meta, Path(str(target)+'.meta'))
        entry['sourceGuid'] = next((s.split(':',1)[1].strip() for s in meta.read_text().splitlines() if s.startswith('guid:')),None)
    manifest.append(entry)
for name, folder in [('actors','pack'),('props','pack'),('world','world'),('furnishings','world')]:
    for ext in ['png','json']:
        copy(root/f'public/assets/{folder}/{name}.{ext}',f'Art/Atlases/{name}.{ext}','world')
copy(root/'public/assets/world/terrain.png','Art/Atlases/terrain.png','world')
for source in (root/'docs/unity/data').glob('*.json'):
    if source.stem!='asset-audit': copy(source,f'Content/{source.name}','definition')
for source in (root/'public/assets/cinematic').glob('*.webp'):
    dest=out/f'Art/Cinematics/{source.stem}.png'; dest.parent.mkdir(parents=True,exist_ok=True)
    Image.open(source).convert('RGB').save(dest,optimize=True)
    manifest.append({'source':str(source),'destination':str(dest.relative_to(project)),'category':'painting','derivedLocally':True})
copy(root/'public/assets/brand/icon-512.png','Art/Brand/icon.png','painting')
groups = {
    'garden':['turnip','potato','carrot','cabbage','radish','corn','pumpkin','cauliflower','berry','mushroom','flower','egg','wool','truffle','feed','fertilizer'],
    'workshop':['wood','stone','copper','iron','crystal','sprinkler','bouquet','ring','soup','omelet','stew','fish_dinner','jam','brass_compass','glass_lens','ancient_chart']
}
for sheet,names in groups.items():
    source=root/f'docs/art-source/{sheet}.png'
    image=Image.open(source).convert('RGBA')
    for i,name in enumerate(names):
        x,y=i%4,i//4
        frame=image.crop((round(x*image.width/4),round(y*image.height/4),round((x+1)*image.width/4),round((y+1)*image.height/4)))
        box=frame.getbbox()
        if box: frame=frame.crop(box)
        dest=out/f'Art/Items/{name}.png'; dest.parent.mkdir(parents=True,exist_ok=True)
        frame.save(dest,optimize=True)
        manifest.append({'source':str(source),'destination':str(dest.relative_to(project)),'category':'item','alpha':True,'index':i})
for family in [5,17,26,13,3,18,4,1,2,7,8,6,9,10,12,15,14,16,28,19,20,30,21,22,25,31,29,23]:
    source=master/f'Characters/Characters/chara_{family}.png'
    copy(source,f'Art/OriginalCharacters/{source.name}','world',True)
for family,weight in [('nunito',400),('nunito',700),('fraunces',400)]:
    source=root/f'node_modules/@fontsource/{family}/files/{family}-latin-{weight}-normal.woff2'
    font=TTFont(source); font.flavor=None
    dest=out/f'Art/Fonts/{family}-{weight}.ttf';dest.parent.mkdir(parents=True,exist_ok=True);font.save(dest)
    copy(root/f'node_modules/@fontsource/{family}/LICENSE',f'Art/Fonts/{family}-LICENSE.txt','license')
    manifest.append({'source':str(source),'destination':str(dest.relative_to(project)),'category':'font','license':'SIL Open Font License'})
(project/'Assets/Dewhaven/Content').mkdir(exist_ok=True)
(project/'Assets/Dewhaven/Content/ImportManifest.json').write_text(json.dumps(manifest,indent=2))
(project/'ProjectSettings/ProjectVersion.txt').write_text('m_EditorVersion: 6000.3.20f1\nm_EditorVersionWithRevision: 6000.3.20f1 (c9ba695d4f07)\n')
print(json.dumps({'imports':len(manifest),'itemIllustrations':32,'characterFamilies':28,'sourceFilesModified':0}))

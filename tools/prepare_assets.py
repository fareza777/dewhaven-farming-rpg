"""Extract local Unity art; the source project and paid master are read-only."""
from pathlib import Path
import json
import shutil
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('E:/Harvest Moon Sprite Opus/public/assets/pack')
MASTER = Path('E:/Pixel Games Asset Master/Assets/Gif/Super_Retro_Collection/Resources')
OUT = ROOT / 'public/assets/world'
OUT.mkdir(parents=True, exist_ok=True)
shutil.copytree(SOURCE, ROOT / 'public/assets/pack', dirs_exist_ok=True)
frames = []

def add(name, image):
    frames.append((name, image.convert('RGBA')))

for category in ['Houses', 'Trees', 'Rocks', 'Crates', 'Barrels', 'Potted plants', 'Lamps', 'Statues']:
    for path in sorted((MASTER / 'Prefabs' / category / 'Sprites').glob('*.png')):
        add(path.stem, Image.open(path))

for layer in ['front', 'back']:
    image = Image.open(MASTER / f'Prefabs_with_behavior/tall_grass_react_on_contact/Sprites/tallgrass_01_{layer}.png')
    for i in range(4):
        add(f'grass/{layer}/{i}', image.crop((i*16, 0, (i+1)*16, 16)))

for path in sorted((MASTER / 'Characters/Characters').glob('chara_*.png')):
    image = Image.open(path)
    for row, direction in enumerate(['down', 'left', 'right', 'up']):
        for col in range(3):
            add(f'{path.stem}/{direction}/{col}', image.crop((col*16,row*20,(col+1)*16,(row+1)*20)))

for species, stem in [('cat','cats/cat1_16x20'),('bird','birds/bird2_16x20'),('rabbit','rabbits/bunny1_16x20')]:
    path = MASTER / 'Characters/Animals' / f'{stem}.png'
    if not path.exists():
        continue
    image = Image.open(path)
    for row, direction in enumerate(['down', 'left', 'right', 'up']):
        for col in range(3):
            add(f'{species}/{direction}/{col}', image.crop((col*16,row*20,(col+1)*16,(row+1)*20)))

for path in (MASTER/'Characters/Animals/pigs/pig_01/move').glob('*.png'):
    image = Image.open(path)
    direction = next((d.lower() for d in ['DOWN','LEFT','RIGHT','UP'] if d in path.stem.upper()), 'down')
    for i in range(image.width//32):
        add(f'pig/{direction}/{i}', image.crop((i*32,0,(i+1)*32,min(image.height,32))))

for path in (MASTER/'Animations/Farm').glob('farm_icons_*_16x16.png'):
    image = Image.open(path)
    for row in range(image.height//16):
        for col in range(image.width//16):
            add(f'{path.stem}/{row*12+col}',image.crop((col*16,row*16,(col+1)*16,(row+1)*16)))

items = []
for name, image in frames:
    box = image.getbbox() or (0,0,1,1)
    items.append((name,image,image.crop(box),box))
items.sort(key=lambda item: (-item[2].height,-item[2].width))
sheet = Image.new('RGBA',(2048,1024))
data = {}
x=y=shelf=0
for name, original, image, box in items:
    if x+image.width+2 > sheet.width:
        x=0
        y+=shelf+2
        shelf=0
    px,py=x+1,y+1
    sheet.paste(image,(px,py))
    data[name]={'frame':{'x':px,'y':py,'w':image.width,'h':image.height},'sourceSize':{'w':original.width,'h':original.height},'spriteSourceSize':{'x':box[0],'y':box[1],'w':image.width,'h':image.height}}
    x+=image.width+2
    shelf=max(shelf,image.height)
height=64
while height<y+shelf+2: height*=2
sheet.crop((0,0,2048,height)).save(OUT/'world.png',optimize=True)
(OUT/'world.json').write_text(json.dumps({'frames':data}),encoding='utf-8')

# A readable reference sheet for choosing local sprite frames.
inspection=Image.new('RGB',(768,384),'#f4eddc')
draw=ImageDraw.Draw(inspection)
for i in range(32):
    image=Image.open(MASTER/f'Characters/Characters/chara_{i}.png').crop((16,0,32,20)).convert('RGBA').resize((48,60),Image.Resampling.NEAREST)
    pos=((i%12)*64,(i//12)*88)
    inspection.paste(image,pos,image)
    draw.text((pos[0],pos[1]+63),f'chara_{i}',fill='#284c3b')
for i,p in enumerate(sorted((MASTER/'Characters/Animals/birds').glob('bird[1-6]_16x20.png'))):
    image=Image.open(p).crop((16,0,32,20)).convert('RGBA').resize((48,60),Image.Resampling.NEAREST)
    pos=(i*64,284)
    inspection.paste(image,pos,image)
    draw.text((pos[0],347),p.stem[:5],fill='#284c3b')
inspection.save(ROOT/'tools/asset-reference.png')
print(f'Copied supplied pack; extracted {len(data)} extra frames to {OUT}')

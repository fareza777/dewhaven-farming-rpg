"""Pack licensed furniture tiles locally; convert original generated inventory atlases to WebP."""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path('E:/Pixel Games Asset Master/Assets/Gif/Super_Retro_Collection/Resources/Environments/original_atlas.png')
BLOCKS = {
 'floor':(36,40,1,1),'cave-floor':(30,45,1,1),'cave-wall':(2,36,1,1),
 'bed':(99,42,1,2),'table':(101,30,2,2),'stool':(97,32,1,1),'chair':(104,35,1,1),
 'bookshelf':(97,38,2,2),'stove':(105,36,1,1),'fridge':(98,40,1,2),'sink':(97,34,2,1),
 'dresser':(106,40,2,2),'painting':(99,40,2,2),'clock':(105,39,1,2),'nightstand':(104,40,1,2),
 'rug':(103,42,2,1),'mat':(103,44,2,1),'plant':(108,26,1,1),'lamp':(104,28,1,1),
 'well':(16,56,2,2),'bin':(21,53,2,2),'stump':(25,4,1,1),'logpile':(27,4,1,2),
 'ladder':(59,45,1,1),'ruin-entry':(49,9,3,3),'lilies':(20,11,1,1),'flowers':(19,12,1,1)
}
for name,block in {
 'meadow-dark-a':(1,1,4,3),'meadow-dark-b':(6,1,3,3),'meadow-dark-c':(2,4,3,3),
 'meadow-light-a':(1,7,3,2),'meadow-light-b':(4,7,2,2),'meadow-light-c':(6,7,3,2),'meadow-light-d':(1,9,3,3),
 'wildflowers-a':(17,9,1,1),'wildflowers-b':(18,9,1,1),'wildflowers-c':(20,9,1,1),
 'pebbles-a':(26,44,1,1),'pebbles-b':(28,44,1,1),'pebbles-c':(26,46,1,1),
}.items(): BLOCKS[name]=block
for y in range(3):
 for x in range(3): BLOCKS[f'wall-{y*3+x}']=(74+x,10+y,1,1)
source=Image.open(SOURCE).convert('RGBA')
sheet=Image.new('RGBA',(512,256)); frames={}; x=y=1; row_h=0
for name,(col,row,w,h) in BLOCKS.items():
 width,height=w*16,h*16
 if x+width+1>512: x=1; y+=row_h+2; row_h=0
 sheet.paste(source.crop((col*16,row*16,(col+w)*16,(row+h)*16)),(x,y))
 frames['room/'+name]={'frame':{'x':x,'y':y,'w':width,'h':height},'sourceSize':{'w':width,'h':height},'spriteSourceSize':{'x':0,'y':0,'w':width,'h':height}}
 x+=width+2;row_h=max(row_h,height)
out=ROOT/'public/assets/world';out.mkdir(parents=True,exist_ok=True)
sheet.crop((0,0,512,y+row_h+1)).save(out/'furnishings.png',optimize=True)
(out/'furnishings.json').write_text(json.dumps({'frames':frames}),encoding='utf-8')
for name in ['garden','workshop']:
 item=ROOT/f'public/assets/items/{name}.png'
 if not item.exists(): item=ROOT/f'docs/art-source/{name}.png'
 image=Image.open(item).convert('RGBA')
 image.save(ROOT/f'public/assets/items/{name}.webp',quality=86,method=6)
 print(name,image.size,'alpha',image.getchannel('A').getextrema())
print(f'Packed {len(frames)} licensed furniture frames. Source files unchanged.')

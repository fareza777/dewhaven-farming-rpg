"""Extract generated atlas cells and their main-bust crop, preserving RGBA artwork."""
from pathlib import Path
from collections import deque
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art/portraits'
TARGET=ROOT/'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Art/Portraits'

def main_bounds(image):
    width,height=image.size
    mask=np.fromiter(image.getchannel('A').getdata(),dtype=np.uint8).reshape((height,width))>12
    seen=np.zeros((height,width),dtype=bool);largest=0;bounds=image.getchannel('A').getbbox()
    for y,x in zip(*np.where(mask)):
        if seen[y,x]:continue
        queue=deque([(int(x),int(y))]);seen[y,x]=True;count=0;left=right=int(x);top=bottom=int(y)
        while queue:
            xx,yy=queue.pop();count+=1;left=min(left,xx);right=max(right,xx);top=min(top,yy);bottom=max(bottom,yy)
            for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                if 0<=nx<width and 0<=ny<height and mask[ny,nx] and not seen[ny,nx]:
                    seen[ny,nx]=True;queue.append((nx,ny))
        if count>largest:
            largest=count;bounds=(max(0,left-2),max(0,top-2),min(width,right+3),min(height,bottom+3))
    return bounds

def pack(image):
    bounds=image.getchannel('A').getbbox()
    if bounds:image=image.crop(bounds)
    image.thumbnail((368,368),Image.Resampling.LANCZOS)
    output=Image.new('RGBA',(384,384));output.paste(image,((384-image.width)//2,384-image.height))
    bounds=main_bounds(output)
    if bounds:
        image=output.crop(bounds);image.thumbnail((368,368),Image.Resampling.LANCZOS)
        output=Image.new('RGBA',(384,384));output.paste(image,((384-image.width)//2,384-image.height))
    return output

if __name__=='__main__':
    TARGET.mkdir(parents=True,exist_ok=True)
    specs=json.loads((SOURCE/'prompts.json').read_text())
    for spec in specs:
        atlas=Image.open(SOURCE/f"portrait-atlas-{spec['sheet']:02}-source.png").convert('RGBA');width,height=atlas.size
        for i,identity in enumerate(spec['ids']):
            cell=atlas.crop((round(i%3*width/3),round(i//3*height/2),round((i%3+1)*width/3),round((i//3+1)*height/2)))
            if identity=='cato':cell=Image.open(SOURCE/'cato-final.png').convert('RGBA')
            pack(cell).save(TARGET/(identity+'.png'))
    print('Extracted 30 transparent portraits; generated art and alpha preserved.')

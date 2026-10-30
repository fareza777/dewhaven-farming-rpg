"""Rasterize the existing original icon for local Android launchers and splash."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parent.parent
res = root / 'android/app/src/main/res'
icon = Image.open(root / 'public/assets/brand/icon-512.png').convert('RGBA')
for density, scale in [('mdpi',1),('hdpi',1.5),('xhdpi',2),('xxhdpi',3),('xxxhdpi',4)]:
    folder = res / f'mipmap-{density}'
    folder.mkdir(parents=True, exist_ok=True)
    for name in ['ic_launcher', 'ic_launcher_round']:
        icon.resize((int(48*scale),int(48*scale)), Image.Resampling.LANCZOS).save(folder / f'{name}.png')
    foreground = Image.new('RGBA',(int(108*scale),int(108*scale)), '#191e21')
    mark = icon.resize((int(66*scale),int(66*scale)),Image.Resampling.LANCZOS)
    foreground.alpha_composite(mark,(int(21*scale),int(21*scale)))
    foreground.save(folder / 'ic_launcher_foreground.png')
for path in res.glob('drawable*/splash.png'):
    splash = Image.new('RGB',(480,800),'#191e21')
    mark = icon.resize((144,144),Image.Resampling.LANCZOS)
    splash.paste(mark,(168,328),mark)
    splash.save(path,optimize=True)
print('Dewhaven Android icons and splash prepared.')

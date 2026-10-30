"""Fetch the author-published CC0 field recordings; never a preview mix."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import urllib.request,zipfile,json,hashlib
root=Path(__file__).resolve().parents[1];out=root/'art/audio/source';out.mkdir(parents=True,exist_ok=True)
assets=[
 ('park_ambience_birds.wav','https://opengameart.org/sites/default/files/park_ambience_birds.wav','Thimras','https://opengameart.org/content/park-ambiences'),
 ('park_ambience_river.wav','https://opengameart.org/sites/default/files/park_ambience_river.wav','Thimras','https://opengameart.org/content/park-ambiences'),
 ('park_ambience_wind.wav','https://opengameart.org/sites/default/files/park_ambience_wind.wav','Thimras','https://opengameart.org/content/park-ambiences'),
 ('rain-ogg.zip','https://opengameart.org/sites/default/files/Rain%20OGG.zip','Ylmir','https://opengameart.org/content/rain-loopable'),
 ('water-sfx.zip','https://opengameart.org/sites/default/files/water-splash-slime-sfx.zip','rubberduck','https://opengameart.org/content/40-cc0-water-splash-slime-sfx')]
def fetch(row):
 name,url,author,page=row;dest=out/name
 sliced=name.endswith('.wav')
 if not dest.exists() or dest.stat().st_size<1024:
  # Only the first 10 MiB are needed for a 32-second field loop. Range avoids
  # downloading the entire multi-minute, 75–100 MB master recording.
  headers={'User-Agent':'Dewhaven Asset Import'}
  if sliced:headers['Range']='bytes=0-10485759'
  request=urllib.request.Request(url,headers=headers)
  temporary=dest.with_suffix(dest.suffix+'.part')
  with urllib.request.urlopen(request,timeout=30) as response,temporary.open('wb') as f:
   while chunk:=response.read(65536):f.write(chunk)
  temporary.replace(dest)
 if dest.suffix=='.zip':
  folder=out/dest.stem;folder.mkdir(exist_ok=True)
  with zipfile.ZipFile(dest) as archive:
   for member in archive.infolist():
    candidate=(folder/member.filename).resolve()
    if not candidate.is_relative_to(folder.resolve()):raise ValueError('Unsafe archive path')
   archive.extractall(folder)
 return dict(file=name,url=url,author=author,page=page,license='CC0',sourceRange='bytes=0-10485759' if sliced else 'full archive',bytes=dest.stat().st_size,sha256=hashlib.sha256(dest.read_bytes()).hexdigest())
with ThreadPoolExecutor(max_workers=4) as pool:records=list(pool.map(fetch,assets))
(root/'art/audio/sources.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
for r in records:print(r['file'],r['bytes'])

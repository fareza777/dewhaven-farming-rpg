"""Restore licensed sprites from the owner's complete local checkout; never downloads assets."""
from pathlib import Path
import argparse,hashlib,json,shutil

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('source',type=Path,help='Complete local Dewhaven checkout owned by the licensed user')
parser.add_argument('--dry-run',action='store_true',help='Check every source hash without copying')
parser.add_argument('--overwrite',action='store_true',help='Allow replacement of different existing files')
args=parser.parse_args();source=args.source.resolve()
manifest=json.loads((ROOT/'docs/licensed-assets-manifest.json').read_text(encoding='utf-8'))
def digest(path):
    with path.open('rb') as stream:return hashlib.file_digest(stream,'sha256').hexdigest()
checked=[];existing=0
for entry in manifest['files']:
    relative=Path(entry['path']);src=(source/relative).resolve();dest=(ROOT/relative).resolve()
    if relative.is_absolute() or '..' in relative.parts or not src.is_relative_to(source) or not dest.is_relative_to(ROOT):
        raise SystemExit('Refusing a path outside the source/destination checkout.')
    if not src.is_file() or digest(src)!=entry['sha256']:
        raise SystemExit('Missing or mismatched licensed source: '+entry['path'])
    if dest.is_file() and digest(dest)==entry['sha256']:existing+=1;continue
    if dest.exists() and not args.overwrite:
        raise SystemExit('Destination differs; review it before using --overwrite: '+entry['path'])
    checked.append((src,dest))
if not args.dry_run:
    for src,dest in checked:
        dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(src,dest)
print(json.dumps(dict(verified=len(manifest['files']),alreadyPresent=existing,toCopy=len(checked),copied=0 if args.dry_run else len(checked),dryRun=args.dry_run)))

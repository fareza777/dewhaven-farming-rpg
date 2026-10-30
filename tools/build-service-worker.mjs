import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
async function list(folder) {
  const files=[];
  for(const item of await readdir(folder,{withFileTypes:true})) {
    const path=join(folder,item.name);
    if(item.isDirectory())files.push(...await list(path));else files.push(path);
  }
  return files;
}
const files=(await list('dist')).filter(path=>!path.endsWith('sw.js')&&!/\.(woff|ttf)$/.test(path)&&!(path.includes('Phosphor-')&&path.endsWith('.svg')));
const core=files.map(path=>'/'+path.replaceAll('\\','/').replace(/^dist\//,''));
core.push('/');
const revision=createHash('sha256');
for(const path of files)revision.update(path).update(await readFile(path));
const template=await readFile('public/sw.js','utf8');
revision.update(template);
const worker=template.replace(/const CACHE=.*?;/,`const CACHE='dewhaven-${revision.digest('hex').slice(0,12)}';`).replace(/const CORE=.*?;/,`const CORE=${JSON.stringify(core)};`);
await writeFile('dist/sw.js',worker);
console.log(`Offline cache: ${core.length} local files.`);

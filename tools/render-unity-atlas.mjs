import { readFile,writeFile } from 'node:fs/promises';
const dir='docs/unity',data={};
for(const name of ['world','towns','interiors','residents','shops','dungeons','quests'])data[name]=JSON.parse(await readFile(`${dir}/data/${name}.json`,'utf8'));
const {ITEMS}=await import('../src/game/content.ts');data.items=ITEMS;
const art={world:'data:image/png;base64,'+(await readFile('public/assets/world/world.png')).toString('base64'),furniture:'data:image/png;base64,'+(await readFile('public/assets/world/furnishings.png')).toString('base64'),frames:JSON.parse(await readFile('public/assets/world/world.json','utf8')).frames,roomFrames:JSON.parse(await readFile('public/assets/world/furnishings.json','utf8')).frames};
const fontFiles=[['Nunito',400,'nunito'],['Nunito',600,'nunito'],['Nunito',700,'nunito'],['Fraunces',400,'fraunces']];let fonts='';
for(const [family,weight,file]of fontFiles){const bytes=await readFile(`node_modules/@fontsource/${file}/files/${file}-latin-${weight}-normal.woff2`);fonts+=`@font-face{font-family:${family};font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2')}\n`;}
const tabs=[['world','Valley'],['towns','Towns'],['dungeons','Dungeons'],['life','Daily life'],['story','Story']].map(([id,label])=>`<button type="button" class="tab" data-mode="${id}">${label}</button>`).join('');
const icon='data:image/png;base64,'+(await readFile('public/assets/brand/icon-192.png')).toString('base64');
let template=await readFile(`${dir}/atlas.template.html`,'utf8');for(const [key,value]of Object.entries({__DATA__:JSON.stringify(data),__ART__:JSON.stringify(art),__FONTS__:fonts,__TABS__:tabs,__ICON__:icon}))template=template.replace(key,()=>value);
await writeFile(`${dir}/atlas.html`,template);console.log('Wrote self-contained local planning atlas.');

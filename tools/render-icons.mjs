import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
const svg=await readFile('public/assets/brand/icon.svg','utf8');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage();
for(const [filename,size,maskable] of [['icon-192.png',192,false],['icon-512.png',512,false],['icon-maskable.png',512,true]]) {
  const data=await page.evaluate(async({svg,size,maskable})=>{
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#1c2429';ctx.fillRect(0,0,size,size);
    const image=new Image();image.src=`data:image/svg+xml;base64,${btoa(svg)}`;await image.decode();
    const margin=maskable?size*.13:0;ctx.drawImage(image,margin,margin,size-margin*2,size-margin*2);
    return canvas.toDataURL('image/png').split(',')[1];
  },{svg,size,maskable});
  await writeFile(`public/assets/brand/${filename}`,Buffer.from(data,'base64'));
}
await browser.close();

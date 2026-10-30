import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const base=path.resolve(import.meta.dirname,'..');
const frames=[30,110,180,290,390,480,570,660,750,855];
for(const format of ['landscape','vertical']){
  const cellWidth=format==='landscape'?480:216;
  const cellHeight=format==='landscape'?270:384;
  const labels=28;const margin=20;const top=60;
  const width=5*cellWidth+6*margin;const height=2*(cellHeight+labels)+3*margin+top;
  const layers=[];
  const heading=Buffer.from(`<svg width="${width}" height="60"><text x="20" y="38" font-family="Arial" font-size="22" fill="#234337">DEWHAVEN — ${format.toUpperCase()} / TEN SCENE PROOFS</text></svg>`);
  layers.push({input:heading,left:0,top:0});
  for(let i=0;i<frames.length;i++){
    const file=path.join(base,`evidence/frames/${format}-${String(frames[i]).padStart(3,'0')}.png`);
    const buffer=await sharp(file).resize(cellWidth,cellHeight,{fit:'contain'}).png().toBuffer();
    const left=margin+(i%5)*(cellWidth+margin);const y=top+margin+Math.floor(i/5)*(cellHeight+labels+margin);
    layers.push({input:buffer,left,top:y});
    const label=Buffer.from(`<svg width="${cellWidth}" height="28"><text x="0" y="21" font-family="Arial" font-size="14" fill="#234337">${String(i+1).padStart(2,'0')} / ${(frames[i]/30).toFixed(2)}s</text></svg>`);
    layers.push({input:label,left,top:y+cellHeight});
  }
  await sharp({create:{width,height,channels:3,background:'#e9e0ce'}}).composite(layers).png().toFile(path.join(base,`evidence/${format}-scene-review.png`));
  console.log('Saved '+format+' scene review');
}

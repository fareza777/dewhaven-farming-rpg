import fs from 'node:fs';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderMedia, renderStill} from '@remotion/renderer';
import sharp from 'sharp';

const root=import.meta.dirname;
const marketing=path.resolve(root,'..');
const phase=process.argv[2]??'all';
const chrome='C:/Program Files/Google/Chrome/Application/chrome.exe';
const serveUrl=await bundle({entryPoint:path.join(root,'src/index.ts'),publicDir:path.join(root,'public'),onProgress:()=>{}});
const browser=await openBrowser('chrome',{browserExecutable:chrome,logLevel:'warn'});
const common={serveUrl,puppeteerInstance:browser,browserExecutable:chrome,logLevel:'warn',timeoutInMilliseconds:90000};
const comps=await getCompositions(serveUrl,common);
const composition=id=>{const c=comps.find(x=>x.id===id);if(!c)throw new Error('Missing composition '+id);return c;};
async function still(id,file,{frame=0,alpha=false}={}){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  await renderStill({...common,composition:composition(id),frame,output:file,imageFormat:'png'});
  const rendered=sharp(fs.readFileSync(file));
  const png=await (alpha?rendered.ensureAlpha():rendered.removeAlpha()).png({compressionLevel:9}).toBuffer();
  fs.writeFileSync(file,png);
  console.log('Saved '+path.relative(marketing,file));
}
try{
  if(['brand','all'].includes(phase)){
    await still('App-Icon-512',path.join(marketing,'play-store/icon/dewhaven-icon-512.png'),{alpha:true});
    await still('App-Icon-1024',path.join(marketing,'play-store/icon/dewhaven-icon-1024.png'),{alpha:true});
    await still('Feature-Graphic',path.join(marketing,'play-store/banner/dewhaven-feature-1024x500.png'));
    await still('Banner-Master',path.join(marketing,'play-store/banner/dewhaven-banner-master-2048x1000.png'));
    await still('Banner-YouTube',path.join(marketing,'play-store/banner/dewhaven-banner-1920x1080.png'));
  }
  if(['screenshots','all'].includes(phase)){
    const names=['fresh-start','four-towns','quiet-fishing','little-friends','scenic-route','woodland-paths','hidden-mystery','your-next-chapter'];
    fs.mkdirSync(path.join(root,'public/exports'),{recursive:true});
    for(let i=0;i<8;i++){
      const n=String(i+1).padStart(2,'0');const file=path.join(marketing,`play-store/screenshots/${n}-${names[i]}.png`);
      await still(`Screenshot-${n}`,file);
      fs.copyFileSync(file,path.join(root,`public/exports/${n}.png`));
    }
  }
  if(['board','finish','all'].includes(phase)) await still('Collection-Overview',path.join(marketing,'dewhaven-collection-overview.png'));
  if(['proof','finish','all'].includes(phase)){
    for(const [format,id] of [['landscape','Dewhaven-Landscape'],['vertical','Dewhaven-Vertical']]){
      for(const frame of [30,110,180,290,390,480,570,660,750,855])
        await still(id,path.join(marketing,`evidence/frames/${format}-${String(frame).padStart(3,'0')}.png`),{frame});
    }
    await still('Dewhaven-Landscape',path.join(marketing,'video/dewhaven-trailer-landscape-poster.png'),{frame:40});
    await still('Dewhaven-Vertical',path.join(marketing,'video/dewhaven-trailer-vertical-poster.png'),{frame:40});
  }
  if(['videos','finish','all'].includes(phase)){
    for(const [id,name] of [['Dewhaven-Landscape','dewhaven-trailer-landscape-1920x1080.mp4'],['Dewhaven-Vertical','dewhaven-trailer-vertical-1080x1920.mp4']]){
      let reported=-1;
      await renderMedia({...common,composition:composition(id),outputLocation:path.join(marketing,'video',name),codec:'h264',audioCodec:'aac',audioBitrate:'320k',crf:17,pixelFormat:'yuv420p',x264Preset:'medium',concurrency:2,onProgress:({progress})=>{const p=Math.floor(progress*10)*10;if(p>reported){reported=p;console.log(`${id}: ${p}%`);}}});
      console.log('Finished '+name);
    }
  }
}finally{await browser.close({silent:true});}

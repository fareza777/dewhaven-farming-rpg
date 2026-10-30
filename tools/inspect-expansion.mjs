import { chromium } from '@playwright/test';
import { mkdir,writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir('docs/screenshots',{recursive:true});
await page.goto('http://localhost:5176');
await page.getByRole('button',{name:'New game',exact:true}).tap();
await page.getByRole('button',{name:'Start game',exact:false}).tap();
await page.getByRole('button',{name:'Skip the tour'}).tap();
await page.getByRole('button',{name:'Step outside',exact:false}).tap();
const scenes=[['farm',21,20.5],['village',23,20],['aster-quay',24,20.5],['sunridge',23.5,19.5],['briar-hollow',23.5,19.5],['farmhouse',12.5,16],['barn',12.5,18],['market',12.5,16],['library',12.5,16],['tide-vault',16.5,17]];
const performance=[];
for(const [area,x,y]of scenes){
 await page.evaluate(({area,x,y})=>{const app=window.__dewhaven;app.world.travel(area,[x,y]);app.world.renderer.center();app.world.timeRate=0;},{area,x,y});
 await page.waitForTimeout(900);
 await page.screenshot({path:`docs/screenshots/world-${area}.png`});
 const sample=await page.evaluate(async()=>{
  const renderer=window.__dewhaven.world.renderer,times=[],original=renderer.draw;
  renderer.draw=function(dt){const start=performance.now();original.call(this,dt);times.push(performance.now()-start);};
  await new Promise(resolve=>setTimeout(resolve,1200));renderer.draw=original;times.sort((a,b)=>a-b);
  return {samples:times.length,medianDrawMs:times[Math.floor(times.length*.5)],p95DrawMs:times[Math.floor(times.length*.95)],groundCaches:renderer.groundCache.size};
 });performance.push({area,...sample});
}
await page.evaluate(()=>{const app=window.__dewhaven;app.state.inventory={turnip:8,potato:5,carrot:3,corn:4,crystal:2,ring:1,soup:3,jam:2};app.open('backpack');});
await page.screenshot({path:'docs/screenshots/generated-inventory.png'});
await writeFile('docs/world-performance.json',JSON.stringify({environment:'Chrome desktop, isolated 390 × 844 touch viewport; CPU canvas draw timing, not a physical-phone FPS guarantee',errors,performance},null,2));
console.log(JSON.stringify({errors,performance},null,2));
await browser.close();

import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const reports=[];
const onlyPeople=process.argv.includes('--people');
await mkdir('docs/screenshots',{recursive:true});
for(const [width,height,touch] of [[1440,900,false],[390,844,true],[320,667,true]]) {
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const page=await context.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:5176');
  await page.getByRole('button',{name:'New game',exact:true}).click();
  await page.locator('[name="playerName"]').fill('Robin');
  await page.locator('[name="farmName"]').fill('Amber');
  await page.getByRole('button',{name:'Start game',exact:false}).click();
  await page.getByRole('button',{name:'Skip the tour'}).click();
  await page.locator('[data-action="begin-day"]').click();
  await page.waitForTimeout(4500);
  await page.screenshot({path:`docs/screenshots/play-${width}.png`});
  for(const [type,tab] of [['new-game',''],['onboarding',''],['journal','main'],['journal','side'],['journal','achievements'],['market','seeds'],['market','supplies'],['market','animals'],['backpack','all'],['craft','food'],['craft','workshop'],['people',''],['person',''],['calendar',''],['calendar','gatherings'],['map',''],['map','far'],['almanac','crops'],['almanac','fish'],['almanac','skills'],['animals',''],['home',''],['home','ads'],['ad-previews',''],['about','ads'],['upgrade',''],['shipping',''],['settings','controls'],['settings','controls:response'],['settings','controls:actions'],['settings','sound'],['settings','display'],['settings','game'],['settings','saves'],['about',''],['share',''],['rate',''],['help',''],['tools',''],['actions',''],['fishing',''],['bond',''],['discovery',''],['chapter',''],['gathering','']]) {
    if(onlyPeople&&type!=='people')continue;
    await page.evaluate(([type,tab])=>{const app=window.__dewhaven;app.ads.supported=tab==='ads';app.ads.state={...app.ads.state,testMode:true,initialized:true,interstitialReady:true,rewardedReady:true};app.state.friendships.mira.points=250;app.open(type,tab==='ads'?'':tab.split(':')[0]);},[type,tab]);
    if(tab==='controls:response')await page.locator('[data-action="controls-page"][data-page="1"]').click();
    if(tab==='controls:actions'){await page.locator('[data-action="controls-page"][data-page="1"]').click();await page.locator('[data-action="controls-page"][data-page="2"]').click();}
    const layout=await page.evaluate(()=>{
      const wrap=document.querySelector('.modal-wrap');
      const tiny=[];const clipped=[];
      for(const el of document.querySelectorAll('.modal-body *')) {
        const style=getComputedStyle(el),rect=el.getBoundingClientRect();
        if(!rect.width||!rect.height||style.display==='none')continue;
        // Painted backgrounds deliberately extend beyond their frame during the slow camera drift.
        if(el.matches('.cinematic-art'))continue;
        const text=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent.trim()).join('');
        if(text&&parseFloat(style.fontSize)<(el.closest('.calendar-grid')?12:13))tiny.push({text:text.slice(0,50),size:style.fontSize});
        if(rect.right>wrap.getBoundingClientRect().right+1||rect.left<wrap.getBoundingClientRect().left-1)clipped.push(text||el.className);
      }
      return {scrollY:Math.max(0,wrap.scrollHeight-wrap.clientHeight),scrollX:Math.max(0,wrap.scrollWidth-wrap.clientWidth),tiny,clipped};
    });
    reports.push({width,height,type,tab,...layout});
    if(width===1440&&['people','journal','market','settings','home'].includes(type))await page.screenshot({path:`docs/screenshots/${type}-${tab||'default'}-desktop.png`});
    if(width===390&&['new-game','people','journal','market','settings','calendar','home','tools','actions','fishing'].includes(type))await page.screenshot({path:`docs/screenshots/${type}-${tab||'default'}-mobile.png`});
  }
  reports.push({width,errors});await context.close();
}
await writeFile(onlyPeople?'docs/people-audit.json':'docs/ui-audit.json',JSON.stringify(reports,null,2));
console.log(JSON.stringify(reports.filter(r=>r.scrollX||r.tiny?.length||r.clipped?.length||r.errors?.length||r.scrollY>180),null,2));
await browser.close();

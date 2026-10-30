import { test,expect } from '@playwright/test';
import { createGame } from '../../src/game/simulation.ts';
import { encodeSave } from '../../src/game/save.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test('item illustrations have no square plates and shortcuts leave the movement corner clear',async({page})=>{
 const s=createGame();s.tutorialDone=true;
 await page.addInitScript(save=>localStorage.setItem('dewhaven.save.0',save),encodeSave(s));
 await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
 for(const [width,height] of [[320,667],[390,844],[412,915]]){
  await page.setViewportSize({width,height});
  const layout=await page.locator('.quick-tool').evaluateAll(els=>els.map(el=>{const b=el.getBoundingClientRect();return{x:b.x,y:b.y,w:b.width,h:b.height};}));
  expect(layout).toHaveLength(6);for(const b of layout){expect(b.x).toBeGreaterThan(width*.48);expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);}
 }
 await page.getByRole('button',{name:'Backpack',exact:true}).tap();
 const art=page.locator('.item-art:has(.generated-item)').first();await expect(art).toBeVisible();
 const styles=await art.evaluate(el=>{const art=getComputedStyle(el),card=getComputedStyle(el.closest('.inventory-item')!);return{art:art.backgroundColor,border:art.borderWidth,card:card.backgroundColor,shadow:card.boxShadow};});
 expect(styles).toEqual({art:'rgba(0, 0, 0, 0)',border:'0px',card:'rgba(0, 0, 0, 0)',shadow:'none'});
 await page.getByRole('button',{name:'Close',exact:true}).tap();
 await page.getByRole('button',{name:'More menu',exact:true}).tap();await page.locator('#modal [data-action="almanac"]').tap();await page.locator('[data-action="almanac-tab"][data-tab="fish"]').tap();
 expect(await page.locator('.crop-entry .item-art').first().evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
});

test('rewarded UI requires an earned native receipt and keeps time paused while presenting',async({page})=>{
 const s=createGame();s.tutorialDone=true;s.energy=20;
 await page.addInitScript(save=>localStorage.setItem('dewhaven.save.0',save),encodeSave(s));
 await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
 await page.evaluate(()=>{
  const w=window as any,app=w.__dewhaven,ads=app.ads;
  // Test-only provider injection; production builds expose no application test API.
  ads.supported=true;ads.state={testMode:true,initialized:true,bannerReady:true,bannerHeight:0,interstitialReady:true,rewardedReady:true,privacyRequired:false,error:''};
  ads.port={status:async()=>ads.state,setBanner:async()=>ads.state,showRewarded:()=>new Promise(resolve=>{w.completeTestAd=resolve;})};
  app.open('home');
 });
 await page.locator('[data-action="watch-reward"]').tap();
 expect(await page.evaluate(()=>(window as any).__dewhaven.world.paused)).toBe(true);
 const time=await page.evaluate(()=>(window as any).__dewhaven.state.time);await page.waitForTimeout(400);
 expect(await page.evaluate(()=>(window as any).__dewhaven.state.time)).toBe(time);
 await page.evaluate(()=>(window as any).completeTestAd({shown:true,earned:false}));
 await expect(page.locator('.toast')).toContainText('No reward');
 expect(await page.evaluate(()=>(window as any).__dewhaven.state.energy)).toBe(20);
 await expect(page.locator('[data-action="watch-reward"]')).toBeDisabled();
 // Advance only the fixture's global-ad clock so a second callback can be tested immediately.
 await page.evaluate(()=>{const app=(window as any).__dewhaven;app.ads.lastFullscreenAt=Date.now()-90001;app.onAdsChanged();});
 await page.locator('[data-action="watch-reward"]').tap();
 await page.evaluate(()=>(window as any).completeTestAd({shown:true,earned:true,receipt:'verified-native-receipt-0001'}));
 await expect(page.locator('.home-summary')).toContainText('45 / 100');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.save.0')!).state.adHistory.rewardCount)).toBe(1);
 await expect(page.locator('[data-action="watch-reward"]')).toBeDisabled();
 for(const [width,height] of [[320,667],[390,844]]){
  await page.setViewportSize({width,height});
  expect(await page.locator('.modal-wrap').evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
 }
 await page.getByRole('button',{name:'Close',exact:true}).tap();
 expect(await page.evaluate(()=>(window as any).__dewhaven.world.paused)).toBe(false);
});

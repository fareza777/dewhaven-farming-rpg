import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900}});
const page=await context.newPage();const errors=[];const failedRequests=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('requestfailed',request=>failedRequests.push({url:request.url(),error:request.failure()?.errorText}));
await mkdir('docs/screenshots',{recursive:true});
try {
await page.goto('http://localhost:4176');
await page.getByRole('button',{name:'New game',exact:true}).click();
await page.locator('[name="playerName"]').fill('Robin');await page.locator('[name="farmName"]').fill('Amber');
await page.getByRole('button',{name:'Start game',exact:false}).click();await page.getByRole('button',{name:'Skip the tour'}).click();
await page.evaluate(()=>navigator.serviceWorker.ready);
await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
await context.setOffline(true);await page.reload();
await expect(page.getByRole('button',{name:'Continue',exact:true})).toBeEnabled();
await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('[data-action="load-slot"][data-slot="0"]').click();
await expect(page.locator('#world')).toBeVisible();
await expect(page.locator('.quick-tools .quick-tool')).toHaveCount(6);
await expect(page.locator('.welcome-row,.mobile-dock,.world-location')).toHaveCount(0);
await page.evaluate(()=>document.fonts.ready);
const result=await page.evaluate(async()=>{
  const cached=(await caches.keys()).filter(k=>k.startsWith('dewhaven-'));
  return {offline:!navigator.onLine,title:document.title,caches:cached,files:(await (await caches.open(cached[0])).keys()).length,savedFarm:JSON.parse(localStorage.getItem('dewhaven.save.0')).state.farmName,missingIcons:[...document.querySelectorAll('.ph')].filter(el=>getComputedStyle(el,':before').content==='none').length,scrollY:document.body.scrollHeight-innerHeight,devApiExposed:'__dewhaven' in window};
});
expect(errors).toEqual([]);expect(failedRequests).toEqual([]);expect(result.offline).toBe(true);expect(result.files).toBeGreaterThan(20);expect(result.savedFarm).toBe('Amber');expect(result.missingIcons).toBe(0);expect(result.scrollY).toBe(0);expect(result.devApiExposed).toBe(false);
await page.screenshot({path:'docs/screenshots/offline-production.png'});
await writeFile('docs/offline-verification.json',JSON.stringify({...result,errors,failedRequests},null,2));
console.log(JSON.stringify({...result,errors,failedRequests},null,2));
} catch(error) {
  await page.screenshot({path:'docs/screenshots/offline-failure.png'}).catch(()=>{});
  console.error(JSON.stringify({errors,failedRequests,page:await page.locator('body').innerText().catch(()=> '')},null,2));
  throw error;
} finally {
await browser.close();
}

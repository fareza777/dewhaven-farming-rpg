// Real Google demo creatives; restricted to the disposable project emulator.
import { chromium, expect as baseExpect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { captureAndroid } from './android-screenshot.mjs';
const expect=baseExpect.configure({timeout:45000}),run=promisify(execFile);
const sdk=process.env.ANDROID_HOME,serial='emulator-5572',appId='com.fajar.dewhaven',qaAvd='dewhaven_sdk_13_qa',cdpPort='9233';assert(sdk);
const adbPath=join(sdk,'platform-tools','adb.exe');
const adb=async(...args)=>(await run(adbPath,['-s',serial,...args],{timeout:60000,maxBuffer:5*1024*1024})).stdout.trim();
assert.equal((await adb('emu','avd','name')).split(/\r?\n/)[0].trim(),qaAvd);
const overlayList=await adb('shell','cmd','overlay','list');
const originalNavigation=overlayList.split(/\r?\n/).find(line=>line.includes('[x]')&&line.includes('com.android.internal.systemui.navbar.'))?.trim().split(/\s+/).at(-1);
assert(originalNavigation,'No observed navigation overlay to restore.');
await adb('shell','cmd','connectivity','airplane-mode','disable');await adb('shell','svc','wifi','enable');
await adb('shell','am','force-stop',appId);await adb('logcat','-c');await adb('shell','am','start','-n',`${appId}/.MainActivity`);
let pid='';await expect.poll(async()=>{pid=await adb('shell','pidof',appId).catch(()=>'');return pid;}).not.toBe('');
await expect.poll(async()=>(await adb('shell','cat','/proc/net/unix')).includes(`webview_devtools_remote_${pid}`)).toBe(true);
await adb('forward',`tcp:${cdpPort}`,`localabstract:webview_devtools_remote_${pid}`);
let browser=await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`,{noDefaults:true}),page;
await expect.poll(()=>{page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost/'));return !!page;}).toBe(true);
page.setDefaultTimeout(60000);
const errors=[],report={appId,version:'1.3.0',apkSha256:createHash('sha256').update(await readFile('release/Dewhaven-debug.apk')).digest('hex'),verifiedAt:new Date().toISOString(),provider:'Google Mobile Ads 25.5.0, official demo units',avd:qaAvd,serial,network:'online dedicated emulator',checks:[],errors};
report.implementationHashes=Object.fromEntries(await Promise.all(['src/ads.ts','src/game/ads.ts','src/main.ts','android/app/src/main/java/com/fajar/dewhaven/DewhavenAdsPlugin.java'].map(async path=>[path,createHash('sha256').update(await readFile(path)).digest('hex')])));
page.on('pageerror',error=>errors.push(error.message));
const check=name=>{report.checks.push(name);console.log('Passed: '+name);};
const tap=async locator=>{
 await expect.poll(async()=>{const focus=(await adb('shell','dumpsys','window')).split(/\r?\n/).find(line=>line.includes('mCurrentFocus='))||'';return focus.includes(`${appId}/`)&&focus.includes('MainActivity');},{timeout:30000,message:'A native overlay is covering the game.'}).toBe(true);
 await expect(locator).toBeVisible();await locator.click({noWaitAfter:true});
};
const status=()=>page.evaluate(()=>window.Capacitor.Plugins.DewhavenAds.status());
const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.save.0')).state);
const screenshot=name=>captureAndroid(adbPath,serial,`docs/screenshots/${name}.png`);
const dump=async()=>{await adb('shell','uiautomator','dump','/sdcard/dewhaven-ad-ui.xml');return adb('shell','cat','/sdcard/dewhaven-ad-ui.xml');};
function bounds(tag) {const b=tag.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);return b?{left:+b[1],top:+b[2],right:+b[3],bottom:+b[4]}:null;}
async function closeControl() {
 let close='',xml='';
 await expect.poll(async()=>{
  xml=await dump();close=(xml.match(/<node\b[^>]*>/g)||[]).find(tag=>/text="(?:Close|Close ad|Dismiss)"/i.test(tag)||/content-desc="(?:Close|Close ad|Dismiss)(?: button)?"/i.test(tag))||'';return !!close;
 },{timeout:60000,intervals:[1000,2000,3000]}).toBe(true);
 await writeFile('tools/.cache/ad-ui.xml',xml);return bounds(close);
}
async function closeNativeAd() {const b=await closeControl();assert(b);await adb('shell','input','tap',String(Math.round((b.left+b.right)/2)),String(Math.round((b.top+b.bottom)/2)));}
async function bannerNavigation() {
 const gestureHeight=report.banner.bannerHeight;
 await browser.close();await adb('shell','am','force-stop',appId);
 await adb('shell','cmd','overlay','enable-exclusive','--category','com.android.internal.systemui.navbar.threebutton');
 await adb('shell','am','start','-n',`${appId}/.MainActivity`);
 await expect.poll(async()=>{pid=await adb('shell','pidof',appId).catch(()=>'');return pid;}).not.toBe('');
 await expect.poll(async()=>(await adb('shell','cat','/proc/net/unix')).includes(`webview_devtools_remote_${pid}`)).toBe(true);
 await adb('forward',`tcp:${cdpPort}`,`localabstract:webview_devtools_remote_${pid}`);
 browser=await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`,{noDefaults:true});await expect.poll(()=>{page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost/'));return !!page;}).toBe(true);page.setDefaultTimeout(60000);page.on('pageerror',error=>errors.push(error.message));
 await expect.poll(async()=>(await status()).bannerReady,{timeout:90000,intervals:[2000,5000]}).toBe(true);
 await page.evaluate(()=>window.Capacitor.Plugins.SystemBars.show({bar:'NavigationBar'}));await page.waitForTimeout(1500);
 await page.evaluate(async()=>{await window.Capacitor.Plugins.DewhavenAds.setBanner({visible:false});await window.Capacitor.Plugins.DewhavenAds.setBanner({visible:true});});
 await expect.poll(async()=>(await status()).bannerHeight).toBeGreaterThan(gestureHeight);
 const xml=await dump(),tags=xml.match(/<node\b[^>]*>/g)||[];await writeFile('tools/.cache/banner-navigation-ui.xml',xml);
 const windows=await adb('shell','dumpsys','window');await writeFile('tools/.cache/banner-navigation-window.txt',windows);
 assert((await adb('shell','cmd','overlay','list')).includes('[x] com.android.internal.systemui.navbar.threebutton'));
 const displayText=await adb('shell','wm','size'),display=displayText.match(/Override size:\s*(\d+)x(\d+)/)||displayText.match(/Physical size:\s*(\d+)x(\d+)/);assert(display);
 const source=windows.split(/\r?\n/).find(line=>/type=navigationBars/.test(line)&&/visible=true/.test(line)&&line.includes(`[${display[1]},${display[2]}]`));
 assert(source,'The three-button navigation bar must be visibly displayed.');
 const navigationTop=+source.match(/frame=\[0,(\d+)\]/)[1];
 const views=tags.filter(tag=>/class="android.webkit.WebView"/.test(tag)).map(bounds).filter(b=>b&&b.top>0&&b.bottom-b.top<600);
 assert(views.length,'Find the observed native banner WebView.');
 const bannerBottom=Math.max(...views.map(b=>b.bottom)),density=await page.evaluate(()=>devicePixelRatio);
 assert(navigationTop-bannerBottom>=Math.round(8*density)-1,'Banner needs an 8 dp gap above native buttons.');
 report.navigation={framebufferWidthPx:+display[1],framebufferHeightPx:+display[2],gestureHeight,threeButtonHeight:(await status()).bannerHeight,bannerBottomPx:bannerBottom,nativeButtonsTopPx:navigationTop,gapPx:navigationTop-bannerBottom,density};
 await screenshot('android-ad-banner-threebutton');check('The banner ends above all three visible Android buttons with an additional 8 dp gap');
 await page.evaluate(()=>window.Capacitor.Plugins.SystemBars.hide());
}
try {
 await expect(page.getByRole('button',{name:'New game',exact:true})).toBeVisible();
 await expect.poll(async()=>(await status()).initialized,{timeout:90000,intervals:[1000,2000,5000]}).toBe(true);
 await expect.poll(async()=>(await status()).bannerReady,{timeout:90000,intervals:[2000,5000]}).toBe(true);
 const banner=await status();assert(banner.testMode&&banner.bannerHeight>0);report.banner=banner;
 const titleHeight=await page.evaluate(()=>innerHeight);assert(titleHeight<await page.evaluate(()=>screen.height));
 await screenshot('android-ad-banner');check('A real adaptive Google demo banner reserves native space below the title without covering buttons');
 await bannerNavigation();
 await tap(page.getByRole('button',{name:'Continue',exact:true}));
 await tap(page.locator('[data-action="load-slot"][data-slot="0"]'));
 await expect.poll(async()=>(await status()).bannerHeight).toBe(0);
 assert.equal(await page.evaluate(()=>innerHeight),await page.evaluate(()=>screen.height));
 check('Gameplay hides the native banner and restores the complete portrait viewport');
 await tap(page.getByRole('button',{name:'Pause',exact:true}));await expect.poll(async()=>(await status()).bannerHeight).toBeGreaterThan(0);
 await tap(page.locator('#modal [data-action="close"]').last());
 await tap(page.getByRole('button',{name:'More menu',exact:true}));
 await tap(page.locator('#modal [data-action="about"]'));await expect.poll(async()=>(await status()).bannerHeight).toBe(0);
 await tap(page.locator('[data-action="ad-previews"]'));
 await expect.poll(async()=>(await status()).interstitialReady,{timeout:90000,intervals:[2000,5000]}).toBe(true);
 await screenshot('android-ad-previews');await adb('shell','input','keyevent','KEYCODE_HOME');await adb('shell','am','start','-n',`${appId}/.MainActivity`);const before=await saved();
 await tap(page.locator('[data-action="ad-interstitial"]'));await closeControl();await screenshot('android-ad-interstitial');
 if(process.argv.includes('--inspect')){await writeFile('docs/admob-partial-verification.json',JSON.stringify(report,null,2));process.exitCode=0;}
 else {
  await closeNativeAd();await expect(page.locator('.ad-preview-message')).toContainText('Preview closed');assert.deepEqual(await saved(),before);check('A real demo interstitial closes back to its menu without changing the story');
  await expect.poll(async()=>(await status()).rewardedReady,{timeout:90000,intervals:[2000,5000]}).toBe(true);
  await tap(page.locator('[data-action="ad-rewarded"]'));await closeControl();await screenshot('android-ad-rewarded');
  await page.waitForTimeout(35000);await closeNativeAd();await expect(page.locator('.ad-preview-message')).toContainText('Reward completed');assert.deepEqual(await saved(),before);check('Google completes a real rewarded demo and preview mode leaves the farm unchanged');
  // Disposable save fixture; the production UI and native reward provider remain intact.
  await tap(page.locator('#modal [data-action="close"]'));
  // Leave gameplay first: its pagehide autosave must not overwrite this fixture.
  await tap(page.getByRole('button',{name:'Pause',exact:true}));
  await tap(page.locator('#modal [data-action="return-title"]'));
  await expect(page.getByRole('button',{name:'New game',exact:true})).toBeVisible();
  await page.evaluate(()=>{const save=JSON.parse(localStorage.getItem('dewhaven.save.0'));save.state.energy=20;localStorage.setItem('dewhaven.save.0',JSON.stringify(save));});
  await page.reload();await tap(page.getByRole('button',{name:'Continue',exact:true}));await tap(page.locator('[data-action="load-slot"][data-slot="0"]'));
  await tap(page.getByRole('button',{name:'More menu',exact:true}));await tap(page.locator('#modal [data-action="home"]'));
  await expect(page.locator('.home-summary')).toContainText('20 / 100');
  await expect.poll(async()=>(await status()).rewardedReady,{timeout:90000,intervals:[2000,5000]}).toBe(true);
  await adb('shell','input','keyevent','KEYCODE_HOME');await adb('shell','am','start','-n',`${appId}/.MainActivity`);
  const offer=page.locator('[data-action="watch-reward"]');await expect(offer).toBeEnabled();const rewardBefore=await saved();
  await screenshot('android-ad-energy-offer');await tap(offer);await closeControl();await page.waitForTimeout(35000);await closeNativeAd();
  await expect(page.locator('.home-summary')).toContainText('45 / 100');
  const claimed=await saved();assert.equal(claimed.energy,45);assert.equal(claimed.time,rewardBefore.time);assert.equal(claimed.adHistory.rewardCount,1);assert.equal(claimed.adHistory.receipts.length,1);await expect(page.locator('[data-action="watch-reward"]')).toBeDisabled();
  report.energyReward={setup:'Disposable native save fixture at 20 energy; no mocked provider or reward callback',before:20,after:claimed.energy,claims:claimed.adHistory.rewardCount,receiptCount:claimed.adHistory.receipts.length,clockUnchanged:claimed.time===rewardBefore.time};
  await screenshot('android-ad-energy-earned');check('A completed real rewarded ad grants exactly 25 energy once, saves the receipt, freezes time and starts cooldown');
  const nativeErrors=await adb('logcat','-d','-v','brief','AndroidRuntime:E','ActivityManager:E','*:S');assert(!nativeErrors.includes('Process: '+appId)&&!nativeErrors.includes('ANR in '+appId));report.nativeAppCrash=false;report.nativeAppANR=false;
 }
 assert.deepEqual(errors,[]);await writeFile('docs/admob-verification.json',JSON.stringify(report,null,2));
}catch(error){await screenshot('android-ad-failure').catch(()=>{});console.error(JSON.stringify({error:String(error),checks:report.checks,status:await status().catch(()=>null),errors},null,2));throw error;}
finally{await adb('shell','cmd','overlay','enable-exclusive','--category',originalNavigation).catch(()=>{});await browser.close().catch(()=>{});await adb('forward','--remove',`tcp:${cdpPort}`).catch(()=>{});}

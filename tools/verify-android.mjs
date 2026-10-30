// Native integration checks run only on this project's disposable emulator.
import { chromium, expect as baseExpect } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { captureAndroid } from './android-screenshot.mjs';

const expect=baseExpect.configure({timeout:60000});
const run=promisify(execFile),sdk=process.env.ANDROID_HOME||process.env.ANDROID_SDK_ROOT;
assert(sdk,'Set ANDROID_HOME to your installed Android SDK.');
const adbPath=join(sdk,'platform-tools','adb.exe'),serial=process.env.DEWHAVEN_QA_SERIAL||'emulator-5572',appId='com.fajar.dewhaven';
const qaAvd='dewhaven_sdk_13_qa',cdpPort='9233';
const adb=async(...args)=>{
  for(let attempt=0;attempt<4;attempt++){
    try{return(await run(adbPath,['-s',serial,...args],{timeout:60000,maxBuffer:4*1024*1024})).stdout.trim();}
    catch(error){if(attempt===3||!/device.*not found|device offline|no devices/i.test(error.stderr||''))throw error;await new Promise(resolve=>setTimeout(resolve,500));}
  }
};
const avd=await adb('emu','avd','name');
assert(avd.split(/\r?\n/)[0].trim()===qaAvd,'Use the dedicated Dewhaven 1.3 QA emulator.');
assert.equal(await adb('shell','getprop','sys.boot_completed'),'1','Wait for the emulator to finish booting.');
// This one-time System UI education overlay belongs to the disposable test device.
await adb('shell','settings','put','secure','immersive_mode_confirmations','confirmed');
await mkdir('docs/screenshots',{recursive:true});
await adb('install','-r','release/Dewhaven-debug.apk');
await adb('shell','pm','clear',appId);
await adb('logcat','-c');
await adb('shell','cmd','connectivity','airplane-mode','enable');
await adb('shell','svc','wifi','disable');
await adb('shell','am','start','-n',`${appId}/.MainActivity`);
let pid='';
await expect.poll(async()=>{pid=await adb('shell','pidof',appId).catch(()=>'');return pid;},{timeout:45000}).not.toBe('');
await expect.poll(async()=>{
  const sockets=await adb('shell','cat','/proc/net/unix');
  return sockets.includes(`webview_devtools_remote_${pid}`);
},{timeout:60000}).toBe(true);
await adb('forward',`tcp:${cdpPort}`,`localabstract:webview_devtools_remote_${pid}`);
const browser=await chromium.connectOverCDP(`http://127.0.0.1:${cdpPort}`,{noDefaults:true});
let page;const runtimeErrors=[];
await expect.poll(()=>{page=browser.contexts().flatMap(c=>c.pages()).find(p=>p.url().startsWith('https://localhost/'));return !!page;}).toBe(true);
page.setDefaultTimeout(60000);
page.on('pageerror',error=>runtimeErrors.push(error.message));
const nativeFocus=async()=>{
  const windows=await adb('shell','dumpsys','window');
  return windows.split(/\r?\n/).find(line=>line.includes('mCurrentFocus='))||'';
};
const gameFocused=async()=>{const focus=await nativeFocus();return focus.includes(`${appId}/`)&&focus.includes('MainActivity');};
const expectGameFocus=()=>expect.poll(gameFocused,{timeout:30000,message:'A system dialog is covering the test app.'}).toBe(true);
const tap=async(locator)=>{
  // The Android WebView reports a scheduled form navigation even when the SPA cancels it.
  // Verify each resulting screen explicitly instead of waiting for that navigation signal.
  await expectGameFocus();await expect(locator).toBeVisible();await locator.click({timeout:60000,noWaitAfter:true});
};
const closeShareSheet=async()=>{
  await expect.poll(nativeFocus,{timeout:30000}).toContain('com.android.intentresolver/');
  for(let attempt=0;attempt<3;attempt++) {
    if(await gameFocused())return;
    const focus=await nativeFocus();assert(focus.includes('com.android.intentresolver/'),'Unexpected native window after export.');
    await adb('shell','input','keyevent','KEYCODE_BACK');
    if(await expect.poll(gameFocused,{timeout:5000}).toBe(true).then(()=>true,()=>false))return;
  }
  await expectGameFocus();
};
const screenshot=async(name,requireFocus=true)=>{
  if(process.argv.includes('--no-captures')&&!(process.argv.includes('--capture-key')&&['android-title','android-gameplay','android-generated-items','android-farmhouse'].includes(name)))return;
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.waitForTimeout(250); // Let the native compositor present the WebView's frame.
  if(requireFocus)await expectGameFocus();
  await captureAndroid(adbPath,serial,`docs/screenshots/${name}.png`);
};
const report={appId,version:'1.3.0',apkSha256:createHash('sha256').update(await readFile('release/Dewhaven-debug.apk')).digest('hex'),verifiedAt:new Date().toISOString(),emulator:'Pixel 6 / Android 16',avd:qaAvd,serial,network:'airplane mode and Wi-Fi disabled before first launch',checks:[],runtimeErrors};
const check=(name)=>{report.checks.push(name);console.log(`Passed: ${name}`);};
try {
  await expectGameFocus();
  await expect(page.getByRole('button',{name:'New game',exact:true})).toBeVisible({timeout:60000});
  const offlineAds=await page.evaluate(()=>window.Capacitor.Plugins.DewhavenAds.status());
  assert(!offlineAds.initialized&&!offlineAds.bannerReady&&!offlineAds.interstitialReady&&!offlineAds.rewardedReady,'Offline startup must defer the advertising SDK.');
  report.adsDeferredOffline=true;
  const metrics=await page.evaluate(()=>({width:innerWidth,height:innerHeight,screenHeight:screen.height,platform:window.Capacitor.getPlatform(),native:document.body.classList.contains('native-android'),devApi:'__dewhaven' in window,offline:!navigator.onLine}));
  assert(metrics.height>metrics.width);assert.equal(metrics.platform,'android');assert(metrics.native);assert(!metrics.devApi);assert(metrics.offline);
  assert(Math.abs(metrics.height-metrics.screenHeight)<2,'The native surface must fill the physical display without an empty status-bar strip.');
  report.viewport=metrics;check('Bundled title and artwork load offline in the native Android WebView');
  await screenshot('android-title');
  await tap(page.getByRole('button',{name:'New game',exact:true}));
  await page.locator('[name="playerName"]').fill('Robin');
  await page.locator('[name="farmName"]').fill('Amber');
  await tap(page.getByRole('button',{name:'Start game',exact:false}));
  for(let scene=0;scene<4;scene++){
    await expect(page.locator('.cinematic-art')).toBeVisible();
    await expect.poll(()=>page.locator('.cinematic-art').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
    await screenshot(`android-intro-${scene+1}`);
    await tap(page.locator('[data-action="next-tour"]'));
  }
  await tap(page.locator('[data-action="next-tour"]'));
  await tap(page.locator('[data-action="finish-tour"]'));
  await expect(page.getByRole('heading',{name:'First light.',exact:true})).toBeVisible();
  await screenshot('android-first-light');
  await tap(page.locator('[data-action="begin-day"]'));
  check('Four cinematic paintings and two short guides lead into the first morning offline');
  await expect(page.locator('#movement-joystick')).toBeVisible();
  await expect(page.locator('.quick-tools .quick-tool')).toHaveCount(6);
  assert(await page.locator('#world').evaluate(canvas=>canvas.clientHeight===innerHeight));
  await expect(page.locator('.welcome-row,.mobile-dock,.world-location')).toHaveCount(0);
  assert(await page.evaluate(()=>document.body.scrollHeight<=innerHeight+1&&document.body.scrollWidth<=innerWidth+1));
  check('The world fills the portrait screen with floating tool shortcuts and no page scrolling');
  await expect(page.locator('.immersive-game')).toHaveClass(/floating-controls/);
  const cdp=await page.context().newCDPSession(page);
  // Enter the real doorstep using the default floating control, then use the bedroom's bed.
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:2,x:85,y:500}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:2,x:85,y:460}]});
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.save.0')).state.player.area),{timeout:15000}).toBe('farmhouse');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const roomBottom=await page.locator('#world').evaluate(canvas=>Array.from(canvas.getContext('2d').getImageData(Math.floor(canvas.width/2),canvas.height-2,1,1).data));assert.equal(roomBottom[3],255);assert(roomBottom[2]>=roomBottom[1]);
  await screenshot('android-farmhouse');
  const bed=await page.evaluate(()=>({x:(17.5*16-Math.max(0,Math.min(384-innerWidth/2,12.5*16-innerWidth/4)))*2,y:11.5*32}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:2,...bed}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.getByRole('heading',{name:'Home, at last.',exact:true})).toBeVisible({timeout:60000});
  await tap(page.getByRole('button',{name:'Close',exact:true}));
  await tap(page.getByRole('button',{name:'More menu',exact:true}));await tap(page.locator('#modal [data-action="map"]'));
  await tap(page.locator('[data-action="travel"][data-area="farm"]'));
  check('A physical doorway enters the furnished farmhouse offline and its bed opens the rest screen');
  const finger={id:1,x:85,y:500};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[finger]});
  await expect(page.locator('#movement-joystick')).toHaveClass(/is-floating/);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...finger,y:540}]});
  await page.waitForTimeout(600);
  await screenshot('android-floating-controls');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('#movement-joystick')).not.toHaveClass(/is-floating/);
  await tap(page.getByRole('button',{name:'Pause',exact:true}));
  await tap(page.locator('#modal').getByRole('button',{name:'Save game',exact:true}));
  assert((await page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.save.0')))).state.player.y>14.5);
  await tap(page.getByRole('button',{name:'Close',exact:true}));
  check('The default floating joystick follows a touch, moves the farmer, and releases cleanly');
  await tap(page.getByRole('button',{name:'Choose tool',exact:true}));
  await expect(page.locator('.tool-choice')).toHaveCount(7);
  await tap(page.locator('#modal').getByRole('button',{name:'Water',exact:true}));
  await expect(page.getByRole('button',{name:'Water nearby',exact:true})).toBeVisible();
  check('The native tool sheet equips tools and updates the contextual action button');
  await screenshot('android-gameplay');
  await tap(page.getByRole('button',{name:'More menu',exact:true}));
  await screenshot('android-menu');
  await expectGameFocus();
  await adb('shell','input','keyevent','KEYCODE_BACK');
  await expect(page.locator('#modal')).not.toBeVisible();
  await adb('shell','input','keyevent','KEYCODE_BACK');
  await expect(page.locator('[data-action="close"]').last()).toBeVisible();
  await expect(page.getByRole('heading',{name:'Paused',exact:true})).toBeVisible();
  check('Android Back closes a menu, then pauses gameplay');
  await tap(page.locator('#modal').getByRole('button',{name:'Resume',exact:true}));
  await adb('shell','input','keyevent','KEYCODE_HOME');
  await expect.poll(async()=>{
    const activity=await adb('shell','dumpsys','activity','activities');
    return !/topResumedActivity=.*com\.fajar\.dewhaven/.test(activity);
  },{timeout:15000}).toBe(true);
  await adb('shell','am','start','-n',`${appId}/.MainActivity`);
  await expectGameFocus();
  await expect(page.getByRole('heading',{name:'Paused',exact:true})).toBeVisible();
  check('Backgrounding saves the story, releases movement, and pauses time');
  await tap(page.locator('#modal').getByRole('button',{name:'Settings',exact:true}));
  await tap(page.getByRole('button',{name:'Response →',exact:true}));
  await expect(page.locator('#haptics-toggle')).toBeChecked();
  assert(await page.evaluate(()=>window.Capacitor.isPluginAvailable('Haptics')&&window.Capacitor.isPluginAvailable('Share')&&window.Capacitor.isPluginAvailable('Filesystem')&&window.Capacitor.isPluginAvailable('DewhavenAds')));
  check('Native vibration, sharing, file export and AdMob plugins are registered');
  await tap(page.locator('[data-action="settings-tab"][data-tab="saves"]'));
  await tap(page.locator('[data-action="export"]'));
  await expect.poll(()=>adb('shell','run-as',appId,'ls','cache'),{timeout:15000}).toContain('dewhaven-amber');
  check('Export writes a JSON save in Android cache for the native share sheet');
  await closeShareSheet();
  await tap(page.getByRole('button',{name:'Close',exact:true}));
  await tap(page.locator('#screen [data-action="pause"]'));
  await tap(page.locator('#modal').getByRole('button',{name:'Save game',exact:true}));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.save.0')));
  assert.equal(saved.state.farmName,'Amber');assert.equal(saved.state.selectedTool,'water');
  await tap(page.getByRole('button',{name:'Close',exact:true}));
  await tap(page.locator('#screen [data-action="pause"]'));
  await tap(page.locator('#modal').getByRole('button',{name:'Return to title',exact:true}));
  await page.reload();
  await tap(page.getByRole('button',{name:'Continue',exact:true}));
  await tap(page.locator('[data-action="load-slot"][data-slot="0"]'));
  await expect(page.getByRole('button',{name:'Water nearby',exact:true})).toBeVisible();
  check('Offline relaunch restores the saved farm and selected tool');
  for(const area of ['aster-quay','sunridge','briar-hollow']){
    await tap(page.getByRole('button',{name:'More menu',exact:true}));await tap(page.locator('#modal [data-action="map"]'));
    await tap(page.locator('[data-action="map-tab"][data-tab="far"]'));
    await tap(page.locator(`[data-action="travel"][data-area="${area}"]`));
    await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.save.0')).state.player.area)).toBe(area);
    await screenshot(`android-${area}`);
  }
  check('All three additional towns are reachable from the map with bundled terrain and scenery offline');
  await tap(page.getByRole('button',{name:'Backpack',exact:true}));
  const illustration=page.locator('.generated-item').first();await expect(illustration).toBeVisible();
  assert.equal(await illustration.evaluate(async el=>{const url=getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1],image=new Image();image.src=url;await image.decode();return image.naturalWidth;}),1254);
  assert.equal(await illustration.evaluate(el=>getComputedStyle(el.closest('.item-art')).backgroundColor),'rgba(0, 0, 0, 0)');
  await screenshot('android-generated-items');await tap(page.getByRole('button',{name:'Close',exact:true}));
  check('The original generated inventory atlas decodes and displays offline in the native bag');
  await tap(page.getByRole('button',{name:'Journal',exact:true}));
  await expect(page.locator('.chapter-step')).toHaveCount(16);
  const chapterLayout=await page.locator('.chapter-step').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect(),label=el.querySelector('span');return{width:r.width,height:r.height,titleVisible:label&&getComputedStyle(label).display!=='none'};}));
  assert(chapterLayout.every(b=>b.width>=44&&b.height>=44&&!b.titleVisible),'Chapter controls must be readable, separate, and large enough to tap.');
  await screenshot('android-journal');await tap(page.getByRole('button',{name:'Close',exact:true}));
  check('Sixteen compact chapter controls have separate 44 px targets without overflowing title text');
  await tap(page.locator('#screen [data-action="pause"]'));
  await tap(page.locator('#modal').getByRole('button',{name:'Return to title',exact:true}));
  await tap(page.getByRole('button',{name:'New game',exact:true}));
  const nameField=page.locator('[name="playerName"]');
  const field=await nameField.evaluate(input=>{const r=input.getBoundingClientRect();return{x:Math.round((r.x+r.width/2)*devicePixelRatio),y:Math.round((r.y+r.height/2)*devicePixelRatio)};});
  await expectGameFocus();
  await adb('shell','input','tap',String(field.x),String(field.y));
  await expect.poll(()=>page.evaluate(()=>innerHeight),{timeout:20000}).toBeLessThan(metrics.screenHeight-100);
  await nameField.fill('Robin');
  await screenshot('android-keyboard');
  await adb('shell','input','keyevent','KEYCODE_BACK');
  await expect.poll(()=>page.evaluate(()=>innerHeight),{timeout:20000}).toBe(metrics.screenHeight);
  await expect(nameField).toBeVisible();
  await tap(page.getByRole('button',{name:'Close',exact:true}));
  check('The native keyboard resizes the form and Back restores the full screen without losing it');
  await screenshot('android-title');
  assert.deepEqual(runtimeErrors,[]);
  await expectGameFocus();
  const nativeErrors=await adb('logcat','-d','-v','brief','AndroidRuntime:E','ActivityManager:E','Capacitor/Console:E','*:S');
  assert(!nativeErrors.includes(`Process: ${appId}`),'Native app crash in logcat.');
  assert(!nativeErrors.includes(`ANR in ${appId}`),'The native app stopped responding during the integration test.');
  report.nativeAppCrash=false;
  report.nativeAppANR=false;
  await writeFile('docs/android-verification.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} catch (error) {
  await screenshot('android-failure',false).catch(()=>{});
  console.error(JSON.stringify({error:String(error),checks:report.checks,runtimeErrors,text:await page.locator('body').innerText().catch(()=>'')},null,2));
  throw error;
} finally {
  await browser.close().catch(()=>{});
  await adb('shell','cmd','connectivity','airplane-mode','disable').catch(()=>{});
  await adb('shell','svc','wifi','enable').catch(()=>{});
  await adb('forward','--remove',`tcp:${cdpPort}`).catch(()=>{});
}

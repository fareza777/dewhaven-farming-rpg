import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AdsController, type AdsPort, type AdState, type AdResult } from '../src/ads.ts';

function fixture() {
  const state:AdState={testMode:true,initialized:true,bannerReady:true,bannerHeight:0,interstitialReady:true,rewardedReady:true,privacyRequired:false,error:''};
  let result:AdResult={shown:true,earned:true,receipt:'native-verified-receipt'},calls=0;
  const port:AdsPort={initialize:async()=>state,status:async()=>state,setBanner:async({visible})=>({...state,bannerHeight:visible?60:0}),showInterstitial:async()=>{calls++;return result;},showRewarded:async()=>{calls++;return result;},privacyOptions:async()=>({shown:false}),addListener:async()=>({remove:async()=>{}})};
  return {ads:new AdsController(port,true,()=>1000000),port,get calls(){return calls;},result(value:AdResult){result=value;}};
}
test('native reward bridge rejects unshown, skipped and missing-receipt responses',async()=>{
  const f=fixture();await f.ads.initialize();
  for(const result of [{shown:false,earned:true,receipt:'native-verified-receipt'},{shown:true,earned:false},{shown:true,earned:true}]){f.result(result);assert.equal((await f.ads.show(true)).earned,false);}
  f.result({shown:true,earned:true,receipt:'native-verified-receipt'});assert.equal((await f.ads.show(true)).earned,true);
  assert.equal(f.ads.presenting,false);assert.equal(f.ads.justResumed,true);
});
test('fullscreen requests serialize, release after failures and respect readiness',async()=>{
  const f=fixture();await f.ads.initialize();let resolve!:(r:AdResult)=>void;
  f.port.showRewarded=()=>new Promise(r=>{resolve=r;});const pending=f.ads.show(true);
  assert.equal(f.ads.presenting,true);assert.equal((await f.ads.show(false)).shown,false);
  resolve({shown:false,earned:false});await pending;assert.equal(f.ads.presenting,false);
  f.port.showRewarded=async()=>{throw Error('offline');};assert.equal((await f.ads.show(true)).earned,false);
  f.ads.state.interstitialReady=false;assert.equal((await f.ads.show(false)).shown,false);
});
test('browser play never initializes or invokes the native ad provider',async()=>{
  const f=fixture();f.ads.supported=false;await f.ads.initialize();await f.ads.banner(true);await f.ads.refresh();assert.equal((await f.ads.show(true)).shown,false);assert.equal(f.calls,0);assert.equal(f.ads.bannerWanted,false);
});
test('offline Android defers SDK work and reconnecting initializes only once',async()=>{
  const f=fixture();let connected=false,starts=0,listeners=0;
  const nativeInitialize=f.port.initialize;
  f.port.initialize=async()=>{starts++;return nativeInitialize();};
  f.port.addListener=async()=>{listeners++;return {remove:async()=>{}};};
  const ads=new AdsController(f.port,true,()=>1000000,()=>connected);
  await ads.initialize();assert.equal(starts,0);assert.equal(listeners,0);assert.equal(ads.state.initialized,false);
  connected=true;await Promise.all([ads.initialize(),ads.initialize()]);await ads.initialize();
  assert.equal(starts,1);assert.equal(listeners,1);assert.equal(ads.state.initialized,true);
});

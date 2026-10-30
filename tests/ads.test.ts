import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/simulation.ts';
import { canInterstitial, canReward, claimAdEnergy } from '../src/game/ads.ts';
import { decodeSave, encodeSave } from '../src/game/save.ts';

test('reward callbacks grant bounded energy once, enforce cooldown and the daily limit',()=>{
 const s=createGame();s.energy=10;const start=1000000;
 for(let i=0;i<3;i++){const at=start+i*90000,receipt=`earned-reward-receipt-${i}`;assert.equal(canReward(s,at),true);assert.equal(claimAdEnergy(s,receipt,at).ok,true);const snapshot=structuredClone(s);assert.equal(claimAdEnergy(s,receipt,at+90000).ok,false);assert.deepEqual(s,snapshot);}
 assert.equal(s.energy,85);assert.equal(canReward(s,start+500000),false);s.totalDays++;s.day++;
 assert.equal(claimAdEnergy(s,'earned-reward-next-day',start+600000).ok,true);assert.equal(s.energy,100);assert.equal(s.adHistory.rewardCount,1);assert.equal(canReward(s,start+900000),false);
 assert.deepEqual(decodeSave(encodeSave(s)),s);
});
test('interstitials protect the opening and require both elapsed time and several days',()=>{
 const s=createGame();s.tutorialDone=true;const start=1000000;
 assert.equal(canInterstitial(s,start,0,start+900000),false);s.totalDays=4;s.day=4;
 assert.equal(canInterstitial(s,start,0,start+179999),false);assert.equal(canInterstitial(s,start,0,start+180000),true);
 s.adHistory.lastInterstitialDay=4;s.totalDays=6;assert.equal(canInterstitial(s,start,0,start+900000),false);
 s.totalDays=7;assert.equal(canInterstitial(s,start,start+800000,start+900000),false);assert.equal(canInterstitial(s,start,0,start+900000),true);
});
test('old stories migrate ad limits and malformed reward history cannot enter a save',()=>{
 const s=createGame(),old=JSON.parse(encodeSave(s));delete old.state.adHistory;
 assert.deepEqual(decodeSave(JSON.stringify(old)).adHistory,s.adHistory);
 old.state.adHistory={...s.adHistory,rewardCount:20};assert.throws(()=>decodeSave(JSON.stringify(old)));
});

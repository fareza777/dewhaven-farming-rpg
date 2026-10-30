import { txt, type GameState, type Result } from './types.ts';
export const AD_ENERGY=25,REWARDS_PER_DAY=3,REWARD_COOLDOWN=90000,INTERSTITIAL_COOLDOWN=180000;
export const newAdHistory=()=>({rewardDay:0,rewardCount:0,lastRewardAt:0,receipts:[] as string[],lastInterstitialDay:0});
export function canReward(s:GameState,now=Date.now()) {
 const h=s.adHistory;return s.energy<s.maxEnergy&&(h.rewardDay===s.totalDays?h.rewardCount:0)<REWARDS_PER_DAY&&now-h.lastRewardAt>=REWARD_COOLDOWN;
}
export function claimAdEnergy(s:GameState,receipt:string,now=Date.now()):Result {
 if(!/^[a-zA-Z0-9-]{16,80}$/.test(receipt)||s.adHistory.receipts.includes(receipt)||!canReward(s,now))return {ok:false,message:txt('This reward is not available right now.','Hadiah belum tersedia saat ini.')};
 const h=s.adHistory;if(h.rewardDay!==s.totalDays){h.rewardDay=s.totalDays;h.rewardCount=0;}
 const amount=Math.min(AD_ENERGY,s.maxEnergy-s.energy);s.energy+=amount;h.rewardCount++;h.lastRewardAt=now;h.receipts.push(receipt);h.receipts=h.receipts.slice(-64);
 return {ok:true,message:txt(`A little energy for your day. +${amount} energy.`,`Energi untuk harimu. +${amount} energi.`),amount};
}
export function canInterstitial(s:GameState,startedAt:number,lastGlobalAt:number,now=Date.now()) {
 return s.tutorialDone&&s.totalDays>=4&&s.totalDays-s.adHistory.lastInterstitialDay>=3&&now-startedAt>=INTERSTITIAL_COOLDOWN&&now-lastGlobalAt>=INTERSTITIAL_COOLDOWN;
}

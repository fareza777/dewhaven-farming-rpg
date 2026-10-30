import { CROPS, ITEMS, QUESTS, VILLAGERS, ACHIEVEMENTS } from './content.ts';
import { STAT_KEYS } from './simulation.ts';
import type { GameState } from './types.ts';
import { AREA_IDS } from './types.ts';
import { DISCOVERY_IDS, GATHERINGS, JOURNEY_STATS } from './expansion-content.ts';
import { newAdHistory } from './ads.ts';

export const SAVE_VERSION=1;
export const SAVE_PREFIX='dewhaven.save.';
export interface SaveSlot { state:GameState; savedAt:string; }
export function encodeSave(state:GameState):string { return JSON.stringify({version:SAVE_VERSION,state}); }
function valid(condition:unknown):asserts condition {if(!condition)throw new Error('This save file is invalid or from an unsupported version.');}
function obj(v:unknown):v is Record<string,unknown> {return typeof v==='object'&&v!==null&&!Array.isArray(v);}
function number(v:unknown,min:number,max:number,integer=true) {return typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max&&(!integer||Number.isInteger(v));}
function string(v:unknown,max:number) {return typeof v==='string'&&v.length<=max;}
function record(v:unknown,keys:string[],min:number,max:number,required=false) {
  valid(obj(v));valid(Object.keys(v).every(k=>keys.includes(k)&&number(v[k],min,max,false)));
  if(required)valid(keys.every(k=>k in v));
}
export function decodeSave(text:string):GameState {
  valid(text.length<250000);const data:unknown=JSON.parse(text);valid(obj(data)&&data.version===SAVE_VERSION&&obj(data.state));const s=data.state;
  valid(string(s.playerName,20)&&string(s.farmName,24));valid(number(s.avatar,0,3)&&number(s.slot,0,2));
  for(const [key,min,max] of [['day',1,28],['season',0,3],['year',1,9999],['totalDays',1,1000000],['time',360,1440],['gold',0,1000000000],['energy',0,220],['maxEnergy',100,220],['capacity',24,40],['mineFloor',1,5],['festivalDay',0,1000000]] as const)valid(number(s[key],min,max));
  valid((s.energy as number)<=(s.maxEnergy as number));valid(['sunny','rain','cloudy','snow'].includes(String(s.weather)));
  record(s.inventory,Object.keys(ITEMS),1,999);record(s.shipping,Object.keys(ITEMS),1,999);
  valid(Object.keys(s.inventory as object).length<=(s.capacity as number));
  valid(Object.values(s.inventory as object).every(v=>Number.isInteger(v))&&Object.values(s.shipping as object).every(v=>Number.isInteger(v)));
  valid(Array.isArray(s.plots)&&[32,50].includes(s.plots.length));const seen=new Set<string>();
  for(const p of s.plots) {valid(obj(p)&&string(p.id,24)&&!seen.has(p.id as string));seen.add(p.id as string);valid(number(p.x,19,26)&&number(p.y,15,24)&&typeof p.tilled==='boolean'&&typeof p.watered==='boolean'&&typeof p.fertilizer==='boolean'&&number(p.growth,0,8));valid(p.crop===null||typeof p.crop==='string'&&!!CROPS[p.crop]);}
  valid(Array.isArray(s.animals)&&s.animals.length<=8);const animalIds=new Set<string>();
  for(const a of s.animals) {valid(obj(a)&&string(a.id,60)&&!animalIds.has(a.id as string)&&string(a.name,16)&&['chicken','pig','rabbit'].includes(String(a.kind))&&number(a.hearts,0,10,false)&&number(a.age,0,1000000)&&typeof a.fed==='boolean'&&typeof a.petted==='boolean'&&typeof a.product==='boolean');animalIds.add(a.id as string);}
  valid(obj(s.friendships)&&Object.keys(s.friendships).every(id=>VILLAGERS.some(v=>v.id===id)));
  for(const v of VILLAGERS)if(v.newcomer&&s.friendships[v.id]===undefined)s.friendships[v.id]={points:0,talked:false,gifted:false,met:false};
  for(const v of VILLAGERS) {const f=s.friendships[v.id];valid(obj(f)&&number(f.points,0,1000)&&typeof f.talked==='boolean'&&typeof f.gifted==='boolean'&&(f.met===undefined||typeof f.met==='boolean'));if(f.met===undefined)f.met=(f.points as number)>0||f.talked||f.gifted;}
  valid(s.partner===null||VILLAGERS.some(v=>v.id===s.partner&&v.romance));record(s.skills,['farming','foraging','fishing','mining'],0,1000000000,true);
  valid(obj(s.stats));for(const key of JOURNEY_STATS)if(s.stats[key]===undefined)s.stats[key]=0;record(s.stats,STAT_KEYS,0,1000000000,true);
  const array=(v:unknown,allowed:string[])=>{valid(Array.isArray(v)&&v.length<=allowed.length&&new Set(v).size===v.length&&v.every(id=>typeof id==='string'&&allowed.includes(id)));};
  array(s.completed,QUESTS.map(q=>q.id));array(s.accepted,QUESTS.filter(q=>!q.main).map(q=>q.id));array(s.achievements,ACHIEVEMENTS.map(q=>q.id));
  if(s.discoveries===undefined)s.discoveries=[];array(s.discoveries,DISCOVERY_IDS);
  if(s.journeyDays===undefined)s.journeyDays={};record(s.journeyDays,['date',...GATHERINGS.map(g=>g.id)],0,1000000);valid(Object.values(s.journeyDays as object).every(Number.isInteger));
  if(s.adHistory===undefined)s.adHistory=newAdHistory();const ad=s.adHistory;valid(obj(ad)&&number(ad.rewardDay,0,s.totalDays as number)&&number(ad.rewardCount,0,3)&&number(ad.lastRewardAt,0,1000000000000000)&&number(ad.lastInterstitialDay,0,s.totalDays as number));
  valid(Array.isArray(ad.receipts)&&ad.receipts.length<=64&&new Set(ad.receipts).size===ad.receipts.length&&ad.receipts.every(r=>typeof r==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(r)));
  record(s.upgrades,['tools','expansion','house','backpack','sprinkler','scarecrow','bridge','greenhouse'],0,2,true);
  valid(obj(s.removed)&&Object.keys(s.removed).length<=512);for(const [id,day] of Object.entries(s.removed)){valid(/^[a-z0-9-]+$/.test(id)&&id.length<=60&&number(day,0,1000000));}
  valid(obj(s.player)&&(AREA_IDS as readonly string[]).includes(String(s.player.area))&&['down','left','right','up'].includes(String(s.player.direction))&&number(s.player.x,0,48,false)&&number(s.player.y,0,34,false));
  valid(typeof s.selectedSeed==='string'&&!!CROPS[s.selectedSeed]);valid(['hand','hoe','water','seed','axe','pickaxe','rod'].includes(String(s.selectedTool)));valid(typeof s.tutorialDone==='boolean');
  (s.stats as Record<string,number>).met=Object.values(s.friendships).filter(f=>(f as Record<string,unknown>).met).length;
  const main=QUESTS.filter(q=>q.main);const completed=s.completed as string[];
  for(let i=1;i<main.length;i++)if(completed.includes(main[i].id))valid(completed.includes(main[i-1].id));
  return structuredClone(s) as unknown as GameState;
}
export function saveSlot(s:GameState):boolean {
  try {localStorage.setItem(SAVE_PREFIX+s.slot,JSON.stringify({version:SAVE_VERSION,state:s,savedAt:new Date().toISOString()}));return true;} catch{return false;}
}
export function readSlot(slot:number):SaveSlot|null {
  try {const raw=localStorage.getItem(SAVE_PREFIX+slot);if(!raw)return null;const state=decodeSave(raw);const data=JSON.parse(raw);return {state,savedAt:typeof data.savedAt==='string'?data.savedAt:''};} catch{return null;}
}
export function occupiedSlots():Array<SaveSlot|null> {return [0,1,2].map(readSlot);}
export function exportSave(s:GameState):void {
  const blob=new Blob([encodeSave(s)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`dewhaven-${s.farmName.toLowerCase().replace(/[^a-z0-9]/g,'-')}-day-${s.totalDays}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

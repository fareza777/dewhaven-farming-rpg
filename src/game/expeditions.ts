import { BOND_SCENES, DUNGEONS, GATHERINGS, TOWN_STATS } from './expansion-content.ts';
import { VILLAGERS } from './content.ts';
import { addItem, removeItem, fits, progress } from './simulation.ts';
import { ROOMS } from '../world/layouts.ts';
import { txt, type Area, type GameState, type Result } from './types.ts';
const fail=(en:string,id:string):Result=>({ok:false,message:txt(en,id)});
const ok=(en:string,id:string,extra:Partial<Result>={}):Result=>({ok:true,message:txt(en,id),...extra});

export function visitArea(s:GameState,area:Area) {
 const stat=TOWN_STATS[area];if(!stat)return false;const first=!s.stats[stat];s.stats[stat]=1;return first;
}
export function residentHere(s:GameState,id:string) {return VILLAGERS.some(v=>v.id===id&&v.area===s.player.area)||ROOMS[s.player.area]?.resident===id;}
export function activateMechanism(s:GameState,area:Area,index:number):Result {
 const d=DUNGEONS.find(d=>d.id===area),key=`${area}-switch-${index}`;
 if(!d||s.player.area!==area||!Number.isInteger(index)||index<0||index>2)return fail('This mechanism is out of reach.','Mekanisme tidak terjangkau.');
 if(s.discoveries.includes(key))return fail('This mechanism is already aligned.','Mekanisme sudah sejajar.');
 if(s.energy<4)return fail('Rest or eat before turning the mechanism.','Istirahat atau makan terlebih dulu.');
 s.energy-=4;s.discoveries.push(key);const count=[0,1,2].filter(i=>s.discoveries.includes(`${area}-switch-${i}`)).length;
 return ok(count===3?'The vault opens.':`Mechanisms aligned · ${count}/3`,count===3?'Ruang terbuka.':`Mekanisme sejajar · ${count}/3`);
}
export function openTreasure(s:GameState,area:Area):Result {
 const d=DUNGEONS.find(d=>d.id===area),key=`${area}-chest`;
 if(!d||s.player.area!==area)return fail('The vault is elsewhere.','Ruang itu berada di tempat lain.');
 if(s.discoveries.includes(key))return fail('You have already recovered this discovery.','Penemuan ini sudah diambil.');
 const missing=[0,1,2].filter(i=>!s.discoveries.includes(`${area}-switch-${i}`)).length;
 if(missing)return fail(`Align ${missing} more ${missing===1?'mechanism':'mechanisms'}.`,`Sejajarkan ${missing} mekanisme lagi.`);
 const reward={[d.item]:1,crystal:2};if(!fits(s,reward))return fail('Make two spaces in your bag for the discovery.','Kosongkan dua tempat di tas.');
 for(const [item,n] of Object.entries(reward))addItem(s,item,n);s.discoveries.push(key);s.stats[d.stat]=1;s.gold+=d.gold;progress(s);
 return ok('A piece of the atlas, recovered.','Bagian atlas telah ditemukan.',{item:d.item,amount:1});
}
export function nextBond(s:GameState,id:string) {
 const scenes=BOND_SCENES[id];if(!scenes)return null;
 const index=scenes.findIndex((_,i)=>!s.discoveries.includes(`bond-${id}-${i}`));
 return index>=0&&(s.friendships[id]?.points||0)>=[200,450,700][index]?{...scenes[index],index}:null;
}
export function shareBond(s:GameState,id:string,index:number,choice=0):Result {
 const scene=nextBond(s,id),v=VILLAGERS.find(v=>v.id===id);
 if(!v||!scene||scene.index!==index||!residentHere(s,id)||!Number.isInteger(choice)||choice<0||choice>1)return fail('Spend a little more time together first.','Luangkan lebih banyak waktu bersama terlebih dulu.');
 if(s.energy<8)return fail('A little rest will help you enjoy this moment.','Beristirahatlah untuk menikmati momen ini.');
 s.energy-=8;s.time=Math.min(1380,s.time+30);s.friendships[id].points=Math.min(1000,s.friendships[id].points+(choice===0?35:25));
 s.discoveries.push(`bond-${id}-${index}`);s.stats.bondEvents++;progress(s);
 return ok(`${v.name} will remember this.`,`${v.name} akan mengingat momen ini.`);
}
export function quietWalk(s:GameState,id:string):Result {
 if(s.partner!==id||!residentHere(s,id))return fail('Visit your partner to spend time together.','Kunjungi pasanganmu untuk menghabiskan waktu bersama.');
 if(s.journeyDays.date===s.totalDays)return fail('You have already shared a quiet walk today.','Kalian sudah berjalan bersama hari ini.');
 if(s.energy<8)return fail('Rest or eat before your walk.','Istirahat atau makan sebelum berjalan.');
 s.energy-=8;s.time=Math.min(1380,s.time+30);s.journeyDays.date=s.totalDays;s.friendships[id].points=Math.min(1000,s.friendships[id].points+15);
 return ok('A little time together, away from the chores.','Sejenak bersama, jauh dari pekerjaan.');
}
export function gatheringReady(s:GameState,id:string) {
 const g=GATHERINGS.find(g=>g.id===id);return !!g&&((s.totalDays-1)%7)+1===g.weekday&&s.journeyDays[id]!==s.totalDays;
}
export function attendGathering(s:GameState,id:string):Result {
 const g=GATHERINGS.find(g=>g.id===id);
 if(!g||g.area!==s.player.area||!gatheringReady(s,id))return fail('Check the gathering day and visit the town.','Periksa jadwal dan kunjungi kotanya.');
 const item=g.items.find(item=>s.inventory[item]);if(!item)return fail('Bring something for the shared table.','Bawa sesuatu untuk meja bersama.');
 if(s.energy<8)return fail('Rest or eat before the gathering.','Istirahat atau makan sebelum pertemuan.');
 removeItem(s,item);s.energy-=8;s.time=Math.min(1380,s.time+45);s.gold+=180;s.stats.communityEvents++;s.journeyDays[id]=s.totalDays;
 s.friendships[g.person].points=Math.min(1000,s.friendships[g.person].points+30);progress(s);
 return ok('Good food. New stories. +180 gold.','Makanan hangat. Kisah baru. +180 emas.');
}

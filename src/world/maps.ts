import type { Area, GameState } from '../game/types.ts';
import { VILLAGERS } from '../game/content.ts';
import { AREA_IDS } from '../game/types.ts';
import { extensionLayout } from './layouts.ts';
export type Ground = 'grass' | 'path' | 'water' | 'woods' | 'stone' | 'floor';
export interface WorldObject { id:string; kind:'building'|'tree'|'rock'|'forage'|'decor'|'exit'|'station'; x:number;y:number;frame?:string;action?:string;label?:string;resource?:'wood'|'stone'|'berry'|'flower'|'mushroom'|'ore';solid?:boolean;w?:number;h?:number;destination?:Area;destinationSpawn?:[number,number]; }
export interface WorldMap { id:Area;w:number;h:number;tiles:Ground[][];objects:WorldObject[];spawn:[number,number];interior?:boolean;theme?:'room'|'cave'|'coast'|'orchard'|'highland'; }
export const MAP_W=48, MAP_H=34;
export interface FenceSegment { x1:number;y1:number;x2:number;y2:number; }
export const FENCES:Record<Area,FenceSegment[]>={
  ...AREA_IDS.reduce((all,id)=>{all[id]=[];return all;},{} as Record<Area,FenceSegment[]>),
  farm:[
    {x1:18,y1:14,x2:28,y2:14},{x1:18,y1:20,x2:22,y2:20},{x1:24,y1:20,x2:28,y2:20},
    {x1:18,y1:14,x2:18,y2:20},{x1:28,y1:14,x2:28,y2:20},
    {x1:28,y1:18,x2:30,y2:18},{x1:32,y1:18,x2:34,y2:18},
  ],village:[],forest:[],lake:[],mine:[],
} as Record<Area,FenceSegment[]>;
export function hash(x:number,y:number,seed=1) {let n=(x*374761393+y*668265263+seed*144269)|0;n=(n^(n>>>13))*1274126177;return ((n^(n>>>16))>>>0)/4294967295;}
function build(id:Area):WorldMap {
  if(!['farm','village','forest','lake','mine'].includes(id))return extensionLayout(id);
  const m:WorldMap={id,w:MAP_W,h:MAP_H,tiles:Array.from({length:MAP_H},()=>Array<Ground>(MAP_W).fill(id==='mine'?'floor':'grass')),objects:[],spawn:[23.5,20]};
  const rect=(x:number,y:number,w:number,h:number,ground:Ground)=>{for(let row=y;row<y+h;row++)for(let col=x;col<x+w;col++)if(m.tiles[row]?.[col])m.tiles[row][col]=ground;};
  const put=(o:Omit<WorldObject,'id'>,name?:string)=>m.objects.push({solid:(o.kind==='station'&&!['fish','mine-down','festival'].includes(o.action||''))||(o.kind==='decor'&&!!o.frame?.startsWith('potted_plant')), ...o,id:`${id}-${name||m.objects.length}`});
  const trees=(coords:number[][],frames=['p/tree_03','p/tree_04','p/tree_12'])=>coords.forEach(([x,y],i)=>put({kind:'tree',x,y,frame:frames[i%frames.length],resource:'wood',solid:true,w:1,h:1}));
  const flower=(x:number,y:number,type:'flower'|'berry'|'mushroom')=>put({kind:'forage',x,y,resource:type});
  // Forest borders create a living frame, with generous paths around the playable middle.
  if(id!=='mine') {
    for(let x=1;x<47;x+=3)for(const y of [3,31])put({kind:'tree',x,y,frame:['p/tree_03','p/tree_04','p/tree_12'][x%3],solid:true});
    for(let y=7;y<30;y+=4)for(const x of [2,45])put({kind:'tree',x,y,frame:'p/tree_04',solid:true});
  }
  if(id==='farm') {
    rect(9,13,25,2,'path');rect(22,11,2,20,'path');rect(12,19,22,2,'path');rect(13,9,9,5,'path');
    for(let y=0;y<34;y++){const riverX=35+Math.round(Math.sin(y*.28)*1.4);rect(riverX,y,4,1,'water');}
    rect(33,19,8,2,'path');
    put({kind:'building',x:17,y:12,frame:'house_19',solid:true,w:4,h:2,action:'home',label:'Home'},'home');
    put({kind:'building',x:30,y:12,frame:'house_14',solid:true,w:3,h:2,action:'animals',label:'Barn'},'barn');
    put({kind:'station',x:14,y:15,frame:'crate_01',action:'shipping',label:'Shipping bin'},'shipping');
    put({kind:'station',x:20,y:12,frame:'barrel_01',action:'craft',label:'Workbench'},'workbench');
    put({kind:'station',x:12,y:13,action:'mail',label:'Mailbox'},'mail');
    put({kind:'exit',x:24,y:28,destination:'village',label:'Dewhaven Village'},'village');
    put({kind:'exit',x:8,y:18,destination:'forest',label:'Whispering Woods'},'forest');
    put({kind:'exit',x:41,y:20,destination:'lake',label:'Moonwater Lake'},'lake');
    trees([[11,10],[8,14],[10,23],[12,25],[29,23],[32,24],[31,8],[26,8],[39,13],[42,25]]);
    [[14,22],[15,24],[28,21],[29,26],[17,26]].forEach(([x,y],i)=>put({kind:'rock',x,y,frame:'rock_21',resource:'stone',solid:true},`rock-${i}`));
    flower(13,18,'flower');flower(11,21,'flower');flower(30,17,'berry');flower(32,18,'flower');
    put({kind:'decor',x:13,y:11,frame:'potted_plant_01'});put({kind:'decor',x:19,y:13,frame:'potted_plant_02'});
  } else if(id==='village') {
    rect(9,16,31,3,'path');rect(22,7,3,24,'path');rect(15,19,20,5,'path');rect(10,9,10,6,'path');rect(26,8,9,6,'path');
    put({kind:'building',x:16,y:13,frame:'house_01',solid:true,w:6,h:2,action:'shop',label:'Mira’s market'},'market');
    put({kind:'building',x:30,y:12,frame:'house_25',solid:true,w:6,h:2,action:'board',label:'Town hall'},'hall');
    put({kind:'building',x:30,y:23,frame:'house_06',solid:true,w:6,h:2,action:'craft',label:'Cleo’s café'},'cafe');
    put({kind:'station',x:22,y:20,action:'board',label:'Request board'},'board');
    put({kind:'station',x:22,y:14,action:'festival',label:'Village square'},'festival');
    put({kind:'station',x:37,y:22,action:'upgrade',label:'Carpenter'},'carpenter');
    put({kind:'building',x:10,y:24,frame:'house_13',solid:true,w:3,h:1,action:'animals',label:'Animal ranch'},'ranch');
    put({kind:'exit',x:23,y:6,destination:'farm',label:'Your homestead'},'farm');
    put({kind:'exit',x:40,y:18,destination:'lake',label:'Moonwater Lake'},'lake');
    put({kind:'exit',x:7,y:18,destination:'forest',label:'Whispering Woods'},'forest');
    put({kind:'exit',x:24,y:29,destination:'mine',label:'Copperleaf Mine'},'mine');
    trees([[8,10],[22,10],[36,11],[40,24],[16,25],[10,28],[34,28]]);
    flower(19,21,'flower');flower(34,17,'flower');flower(14,18,'flower');
  } else if(id==='forest') {
    rect(6,17,36,3,'path');rect(17,8,3,18,'path');rect(16,22,18,2,'path');
    trees([[7,9],[12,11],[22,10],[27,11],[32,9],[37,13],[9,15],[13,20],[11,25],[8,28],[23,26],[28,25],[34,26],[38,23],[30,17],[32,20],[15,8]],['p/tree_04','p/tree_12','p/tree_03','tree_13']);
    [[13,16],[22,15],[26,21],[35,19],[17,24],[28,13],[32,23],[12,27]].forEach(([x,y],i)=>flower(x,y,i%3===0?'mushroom':i%3===1?'berry':'flower'));
    put({kind:'building',x:18,y:13,frame:'house_17',solid:true,w:3,h:2,action:'npc:rowan',label:'Ranger’s cabin'});
    put({kind:'exit',x:41,y:18,destination:'farm',label:'Your homestead'},'farm');
    put({kind:'exit',x:35,y:22,destination:'mine',label:'Copperleaf Mine'},'mine');
    [[24,23],[10,18],[36,17]].forEach(([x,y])=>put({kind:'rock',x,y,resource:'stone',frame:'rock_30',solid:true}));
    m.spawn=[37.5,18.5];
  } else if(id==='lake') {
    rect(8,19,16,3,'path');rect(19,14,3,15,'path');
    for(let y=7;y<29;y++)for(let x=23;x<42;x++)if(((x-32)/9)**2+((y-18)/10)**2<1)m.tiles[y][x]='water';
    rect(21,20,9,2,'path');
    put({kind:'building',x:17,y:15,frame:'house_15',solid:true,w:3,h:1,action:'npc:finn',label:'Finn’s cabin'});
    put({kind:'station',x:27,y:21,action:'fish',label:'Fishing pier'},'pier');
    put({kind:'exit',x:8,y:20,destination:'farm',label:'Your homestead'},'farm');
    put({kind:'exit',x:20,y:28,destination:'village',label:'Dewhaven Village'},'village');
    trees([[10,13],[13,12],[14,25],[19,10],[24,8],[40,12],[39,26]]);
    flower(18,23,'flower');flower(21,16,'berry');flower(12,23,'flower');m.spawn=[12.5,20.5];
  } else {
    rect(0,0,48,34,'stone');rect(9,10,31,17,'floor');rect(15,6,18,22,'floor');rect(15,26,13,4,'floor');
    put({kind:'building',x:14,y:15,frame:'house_16',solid:true,w:3,h:2,action:'upgrade',label:'Orin’s forge'});
    put({kind:'station',x:32,y:25,action:'mine-down',label:'Go deeper'},'stairs');
    put({kind:'exit',x:23,y:29,destination:'village',label:'Dewhaven Village'},'village');
    [[20,13],[24,12],[28,14],[32,12],[36,15],[19,20],[23,22],[27,20],[31,18],[34,22],[37,20],[22,17],[29,25]].forEach(([x,y],i)=>put({kind:'rock',x,y,frame:i%3===0?'rock_36':'rock_21',resource:'ore',solid:true},`ore-${i}`));
    m.spawn=[23.5,26.5];
  }
  const rooms:Record<string,Area>={home:'farmhouse',animals:id==='farm'?'barn':'ranch',shop:'market',board:'townhall',craft:'cafe','npc:rowan':'ranger-house','npc:finn':'lake-house',upgrade:'forge'};
  for(const o of m.objects)if(o.kind==='building'&&rooms[o.action||'']){o.destination=rooms[o.action!];o.action='enter';}
  if(id==='village'){rect(34,25,5,2,'path');put({kind:'exit',x:37,y:26,destination:'aster-quay',destinationSpawn:[9.5,19.5]},'quay-road');}
  if(id==='forest'){rect(7,6,3,12,'path');put({kind:'exit',x:8,y:6,destination:'sunridge',destinationSpawn:[9.5,19.5]},'orchard-road');}
  if(id==='mine'){m.interior=true;m.theme='cave';put({kind:'exit',x:31,y:7,destination:'briar-hollow',destinationSpawn:[23.5,26.5]},'highland-road');}
  return m;
}
export const MAPS=Object.fromEntries(AREA_IDS.map(id=>[id,build(id)])) as Record<Area,WorldMap>;
export function objectVisible(s:GameState,o:WorldObject) {const key=o.resource==='ore'?`${o.id}-f${s.mineFloor}`:o.id;return !o.resource||s.removed[key]===undefined||s.totalDays-s.removed[key]>=2;}
export function animalPositions(s:GameState) {
  if(s.player.area!=='farm'&&s.player.area!=='barn')return [];
  const barn=s.player.area==='barn';
  return s.animals.map((animal,i)=>({animal,x:(barn?8.5:29)+i%3*(barn?3:1.3),y:(barn?14.5:15)+Math.floor(i/3)*(barn?2:1.7)}));
}
export function isBlocked(s:GameState,x:number,y:number):boolean {
  const m=MAPS[s.player.area],rx=.22,ry=.14;
  if(x-rx<1||y-ry<1||x+rx>=m.w-1||y+ry>=m.h-1)return true;
  const overlaps=(left:number,top:number,right:number,bottom:number)=>x+rx>left&&x-rx<right&&y+ry>top&&y-ry<bottom;
  for(let row=Math.floor(y-ry);row<=Math.floor(y+ry);row++)for(let col=Math.floor(x-rx);col<=Math.floor(x+rx);col++){
    const t=m.tiles[row]?.[col];if((t==='water'||m.interior&&t==='stone')&&overlaps(col,row,col+1,row+1))return true;
  }
  if(FENCES[s.player.area].some(f=>overlaps(f.x1-.08,f.y1-.08,f.x2+.08,f.y2+.08)))return true;
  if(VILLAGERS.some(v=>v.area===s.player.area&&overlaps(v.x+.23,v.y+.82,v.x+.77,v.y+1.14)))return true;
  if(animalPositions(s).some(a=>overlaps(a.x-.4,a.y-.25,a.x+.4,a.y+.25)))return true;
  return m.objects.some(o=>{
    if(!o.solid||!objectVisible(s,o))return false;
    const w=o.w||(o.kind==='tree'?.85:o.kind==='rock'?.8:.75),h=o.h||(o.kind==='tree'?.75:.65);
    return overlaps(o.x+.5-w/2,o.y+1-h,o.x+.5+w/2,o.y+1);
  });
}
export function findPath(s:GameState,tx:number,ty:number):Array<[number,number]> {
  const sx=Math.floor(s.player.x),sy=Math.floor(s.player.y);tx=Math.floor(tx);ty=Math.floor(ty);
  if(isBlocked(s,tx+.5,ty+.5))return [];
  const open:Array<[number,number]>=[[sx,sy]];const parent=new Map<string,string>();const visited=new Set([`${sx},${sy}`]);let found=false;
  for(let head=0;head<open.length&&head<1800;head++) {const [x,y]=open[head];if(x===tx&&y===ty){found=true;break;}for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){const key=`${nx},${ny}`;if(!visited.has(key)&&!isBlocked(s,nx+.5,ny+.5)&&!isBlocked(s,(x+nx+1)/2,(y+ny+1)/2)){visited.add(key);parent.set(key,`${x},${y}`);open.push([nx,ny]);}}}
  if(!found)return [];const path:Array<[number,number]>=[];let key=`${tx},${ty}`;while(key!==`${sx},${sy}`){const [x,y]=key.split(',').map(Number);path.unshift([x+.5,y+.5]);key=parent.get(key)!;}return path;
}

import type { Area } from '../game/types.ts';
import type { WorldMap, WorldObject, Ground } from './maps.ts';

interface RoomDef {out:Area;spawn:[number,number];style:'home'|'shop'|'hall'|'kitchen'|'barn'|'study'|'forge'|'glasshouse';resident?:string;}
export const ROOMS:Partial<Record<Area,RoomDef>>={
 farmhouse:{out:'farm',spawn:[17.5,14.5],style:'home'},barn:{out:'farm',spawn:[30.5,14.5],style:'barn'},
 market:{out:'village',spawn:[16.5,15],style:'shop',resident:'mira'},townhall:{out:'village',spawn:[30.5,14],style:'hall',resident:'elias'},cafe:{out:'village',spawn:[30.5,25],style:'kitchen',resident:'cleo'},ranch:{out:'village',spawn:[10.5,26],style:'barn'},
 'ranger-house':{out:'forest',spawn:[18.5,15],style:'study',resident:'rowan'},'lake-house':{out:'lake',spawn:[17.5,17],style:'home',resident:'finn'},forge:{out:'mine',spawn:[14.5,17],style:'forge',resident:'orin'},
 'quay-inn':{out:'aster-quay',spawn:[14.5,14],style:'home'},'quay-workshop':{out:'aster-quay',spawn:[24.5,13],style:'forge',resident:'sera'},
 'orchard-house':{out:'sunridge',spawn:[16.5,14],style:'kitchen',resident:'tamsin'},glasshouse:{out:'sunridge',spawn:[32.5,14],style:'glasshouse'},
 library:{out:'briar-hollow',spawn:[16.5,14],style:'hall',resident:'ilan'},'archive-house':{out:'briar-hollow',spawn:[31.5,14],style:'study'}
};
export function extensionLayout(id:Area):WorldMap {
 const room=ROOMS[id],dungeon=id.endsWith('-vault');
 const w=room?24:dungeon?32:48,h=room?24:dungeon?26:34;
 const m:WorldMap={id,w,h,tiles:Array.from({length:h},()=>Array<Ground>(w).fill(room||dungeon?'stone':'grass')),objects:[],spawn:room?[12.5,18.5]:dungeon?[16.5,22.5]:[23.5,23.5],interior:!!room||dungeon,theme:room?'room':dungeon?'cave':id==='aster-quay'?'coast':id==='sunridge'?'orchard':'highland'};
 const rect=(x:number,y:number,ww:number,hh:number,t:Ground)=>{for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)if(m.tiles[yy]?.[xx])m.tiles[yy][xx]=t;};
 const put=(o:Omit<WorldObject,'id'>,key:string)=>m.objects.push({...o,id:`${id}-${key}`});
 const furniture=(key:string,x:number,y:number,frame:string,action?:string,solid=true,ww=1)=>put({kind:action?'station':'decor',x,y,frame:`room/${frame}`,action,solid,w:ww,h:.7},key);
 const exit=(key:string,x:number,y:number,destination:Area,destinationSpawn?:[number,number])=>put({kind:'exit',x,y,destination,destinationSpawn},key);
 const building=(key:string,x:number,y:number,frame:string,destination:Area,ww=4)=>put({kind:'building',x,y,frame,destination,action:'enter',solid:true,w:ww,h:1.8},key);
 if(room){
  rect(4,6,16,14,'floor');
  rect(11,19,3,3,'floor');
  furniture('entry-mat',12,19,'mat',undefined,false,2);furniture('rug',11,14,'rug',undefined,false,2);
  furniture('plant-left',5,8,'plant');furniture('plant-right',18,8,'plant');furniture('clock',11,6,'clock',undefined,false);
  furniture('lamp',18,15,'lamp',undefined,false);furniture('dresser',6,7,'dresser',undefined,true,2);
  if(room.style==='home'){
   furniture('bed',17,10,'bed','home');furniture('bedside',18,10,'nightstand');furniture('table',10,11,'table',undefined,true,2);
   furniture('chair',10,13,'chair');furniture('stove',5,11,'stove','craft');furniture('sink',6,11,'sink',undefined,true,2);furniture('books',15,7,'bookshelf',undefined,true,2);
  }else if(room.style==='kitchen'){
   furniture('stove',6,9,'stove','craft');furniture('sink',8,9,'sink',undefined,true,2);furniture('fridge',5,9,'fridge');
   for(const x of [8,15]){furniture('table-'+x,x,13,'table',undefined,true,2);furniture('chair-'+x,x,15,'chair');}
   furniture('flowers',16,12,'flowers',undefined,false);
  }else if(room.style==='shop'){
   furniture('counter',10,11,'table','shop',true,2);for(const x of [6,9,15,18])furniture('shelf-'+x,x,8,'bookshelf',undefined,true,2);
   furniture('seeds',7,14,'bin','shop',true,2);furniture('plant',17,13,'plant');
  }else if(room.style==='barn'){
   for(const x of [6,9,16])furniture('feed-'+x,x,9,'bin','animals',true,2);
   furniture('workbench',16,13,'table','animals',true,2);furniture('hay',6,14,'logpile');
  }else if(room.style==='forge'){
   furniture('stove',6,10,'stove','upgrade');furniture('bench',9,11,'table','upgrade',true,2);furniture('bench2',15,13,'table','craft',true,2);
   for(const x of [6,17])furniture('timber-'+x,x,15,'logpile');furniture('storage',17,8,'bin',undefined,true,2);
  }else if(room.style==='glasshouse'){
   for(const y of [9,12,15])for(const x of [6,8,16,18])furniture(`plant-${x}-${y}`,x,y,'plant','seeds');
   furniture('bench',11,8,'table','craft',true,2);
  }else{
   for(const x of [5,8,14,17])furniture('book-'+x,x,8,'bookshelf',undefined,true,2);
   furniture('desk',10,13,'table',room.style==='hall'?'board':'letter',true,2);furniture('chair',10,15,'chair');furniture('painting',16,6,'painting',undefined,false,2);
  }
  if(room.resident)put({kind:'station',x:14,y:11,action:`npc:${room.resident}`,solid:true,w:.6,h:.5},'resident');
  exit('outside',12,20,room.out,room.spawn);
 }else if(dungeon){
  rect(5,6,22,17,'floor');rect(3,11,4,7,'floor');rect(25,9,4,8,'floor');
  rect(15,22,3,3,'floor');
  for(const [x,y] of [[11,8],[21,8],[11,15],[21,15]])put({kind:'rock',x,y,frame:'rock_21',solid:true},`pillar-${x}-${y}`);
  for(const [i,[x,y]] of [[7,10],[24,11],[16,18]].entries())put({kind:'station',x,y,action:`mechanism:${id}:${i}`,solid:true,w:.6,h:.5},`switch-${i}`);
  put({kind:'station',x:16,y:8,action:`treasure:${id}`,solid:true,w:1,h:.65},'chest');
  for(const [x,y] of [[8,16],[23,19],[25,7]])put({kind:'rock',x,y,frame:'rock_36',resource:'ore',solid:true},`ore-${x}-${y}`);
  exit('outside',16,23,id==='tide-vault'?'aster-quay':id==='ember-vault'?'sunridge':'briar-hollow',id==='tide-vault'?[39.5,14]:id==='ember-vault'?[38.5,10]:[35.5,10]);
 }else{
  m.spawn=[23.5,21.5];
  rect(9,18,32,3,'path');rect(22,8,3,20,'path');
  for(let x=2;x<47;x+=4)for(const y of [3,31])put({kind:'tree',x,y,frame:x%3?'p/tree_04':'p/tree_12',solid:true},`edge-${x}-${y}`);
  if(id==='aster-quay'){
   rect(0,27,48,7,'water');rect(31,0,3,27,'water');rect(29,18,7,3,'path');rect(22,23,4,8,'path');
   building('inn',14,12,'house_08','quay-inn');building('boatworks',24,11,'house_14','quay-workshop',3);building('vault',39,12,'room/ruin-entry','tide-vault',3);
   furniture('well',12,21,'well',undefined,true,2);furniture('table',24,22,'table','gathering:quay-fair',true,2);
   for(const [x,y]of [[21,22],[26,22],[21,26],[26,26]])furniture(`dock-light-${x}-${y}`,x,y,'lamp',undefined,false);
   for(const [x,y]of [[19,14],[27,15],[37,16]])furniture(`delivery-${x}-${y}`,x,y,'bin',undefined,true,2);
   exit('valley',9,19,'village',[37.5,26.5]);
  }else if(id==='sunridge'){
   rect(11,12,25,2,'path');rect(29,8,11,2,'path');
   building('house',16,12,'house_10','orchard-house');building('glasshouse',32,12,'house_23','glasshouse');building('gallery',38,8,'room/ruin-entry','ember-vault',3);
   for(const y of [23,27])for(const x of [11,16,29,34,39])put({kind:'tree',x,y,frame:'p/tree_03',solid:true,resource:'wood'},`orchard-${x}-${y}`);
   for(const [x,y] of [[13,23],[31,23],[37,27]])put({kind:'forage',x,y,resource:'berry'},`berry-${x}-${y}`);
   for(const [x,y]of [[18,21],[27,21],[18,25],[27,25]])furniture(`garden-${x}-${y}`,x,y,'plant',undefined,false);
   for(const [x,y]of [[19,15],[27,15]]){furniture(`picnic-${x}`,x,y,'stool',undefined,true);furniture(`bloom-${x}`,x,y+1,'wildflowers-b',undefined,false);}
   furniture('table',23,16,'table','gathering:orchard-fair',true,2);exit('woods',8,19,'forest',[8.5,7.5]);exit('hollow',40,19,'briar-hollow',[9.5,19.5]);
  }else{
   rect(6,8,6,7,'water');rect(11,12,25,2,'path');rect(33,8,4,12,'path');
   building('archive',16,12,'house_25','library',5);building('study',31,12,'house_08','archive-house');building('observatory',35,8,'room/ruin-entry','sky-vault',3);
   furniture('well',16,23,'well',undefined,true,2);furniture('table',23,16,'table','gathering:archive-fair',true,2);
   for(const [x,y]of [[19,20],[27,20],[19,24],[27,24]])furniture(`courtyard-${x}-${y}`,x,y,'plant',undefined,true);
   furniture('reading-bench',30,18,'table',undefined,true,2);furniture('reading-chair',30,20,'chair');
   exit('orchard',8,19,'sunridge',[39.5,19.5]);exit('mine',23,28,'mine',[31.5,8.5]);
  }
  for(const [x,y] of [[8,15],[42,22],[39,24],[7,24]])put({kind:'tree',x,y,frame:'p/tree_12',solid:true,resource:'wood'},`tree-${x}-${y}`);
  for(const [x,y] of [[13,17],[27,22],[35,22]])put({kind:'forage',x,y,resource:'flower'},`flower-${x}-${y}`);
 }
 return m;
}

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, actOnPlot, sleep, buy, sell, claimQuest, talk, careAnimal, craft, addItem, removeItem, gift, expandFarm } from '../src/game/simulation.ts';
import { CROPS } from '../src/game/content.ts';
import { encodeSave, decodeSave } from '../src/game/save.ts';

test('farming requires tilling, seed and water; growth happens on watered nights', () => {
  const s = createGame('Fajar','Sunleaf');
  const p = s.plots[0];
  p.tilled=false; p.crop=null;
  assert.equal(actOnPlot(s,p.id,'seed','turnip').ok,false);
  assert.equal(actOnPlot(s,p.id,'hoe').ok,true);
  const seeds=s.inventory.turnip_seed;
  assert.equal(actOnPlot(s,p.id,'seed','turnip').ok,true);
  assert.equal(s.inventory.turnip_seed,seeds-1);
  sleep(s); assert.equal(p.growth,0);
  for(let i=0;i<CROPS.turnip.days;i++) { actOnPlot(s,p.id,'water'); sleep(s); }
  const harvest=s.stats.harvested;
  assert.equal(actOnPlot(s,p.id,'hand').ok,true);
  assert.equal(s.stats.harvested,harvest+1);
  assert.equal(p.crop,null);
});
test('seasonal planting rejects incompatible seeds without spending anything', () => {
  const s=createGame(); s.inventory.pumpkin_seed=1; s.plots[0].crop=null; s.plots[0].tilled=true;
  const energy=s.energy;
  assert.equal(actOnPlot(s,s.plots[0].id,'seed','pumpkin').ok,false);
  assert.equal(s.inventory.pumpkin_seed,1); assert.equal(s.energy,energy);
});
test('purchases and sales are atomic and reject negative or noninteger quantities', () => {
  const s=createGame(); const gold=s.gold;
  assert.equal(buy(s,'turnip_seed',-1).ok,false);
  assert.equal(buy(s,'turnip_seed',1.5).ok,false);
  assert.equal(s.gold,gold);
  assert.equal(buy(s,'turnip_seed',2).ok,true);
  assert.equal(s.gold,gold-40);
  assert.equal(sell(s,'turnip_seed',9999).ok,false);
  assert.equal(s.gold,gold-40);
});
test('shipping settles once overnight', () => {
  const s=createGame(); addItem(s,'turnip',3); const gold=s.gold;
  assert.equal(sell(s,'turnip',3).ok,true);
  assert.equal(s.gold,gold); assert.equal(s.shipping.turnip,3);
  sleep(s); assert.equal(s.gold,gold+3*CROPS.turnip.sell);
  sleep(s); assert.equal(s.gold,gold+3*CROPS.turnip.sell);
});
test('calendar rolls season/year, clears out-of-season crops and bounds energy', () => {
  const s=createGame(); s.day=28; s.season=0; s.energy=1;
  s.plots[0].crop='turnip'; sleep(s);
  assert.equal(s.day,1); assert.equal(s.season,1); assert.equal(s.energy,s.maxEnergy);
  assert.equal(s.plots[0].crop,null);
  s.day=28; s.season=3; sleep(s); assert.equal(s.year,2); assert.equal(s.season,0);
});
test('quests follow story order and rewards cannot be claimed twice', () => {
  const s=createGame(); s.stats.planted=3;
  assert.equal(claimQuest(s,'first-harvest').ok,false);
  const gold=s.gold;
  assert.equal(claimQuest(s,'new-roots').ok,true);
  assert.ok(s.gold>gold);
  const after=s.gold; assert.equal(claimQuest(s,'new-roots').ok,false); assert.equal(s.gold,after);
});
test('conversation and animal care are limited per day', () => {
  const s=createGame(); assert.equal(talk(s,'mira').ok,true); const hearts=s.friendships.mira.points;
  assert.equal(talk(s,'mira').ok,false); assert.equal(s.friendships.mira.points,hearts);
  const a=s.animals[0]; assert.equal(careAnimal(s,a.id,'pet').ok,true);
  assert.equal(careAnimal(s,a.id,'pet').ok,false);
  sleep(s); assert.equal(talk(s,'mira').ok,true); assert.equal(careAnimal(s,a.id,'pet').ok,true);
});
test('crafting with missing ingredients never consumes available ones', () => {
  const s=createGame(); s.inventory.wood=3; delete s.inventory.stone;
  const before={...s.inventory}; assert.equal(craft(s,'sprinkler').ok,false); assert.deepEqual(s.inventory,before);
});
test('full backpack does not remove a crop when harvest cannot fit', () => {
  const s=createGame(); s.inventory={}; s.capacity=2; s.inventory.wood=1; s.inventory.stone=1;
  const p=s.plots[0]; p.crop='turnip'; p.growth=CROPS.turnip.days;
  assert.equal(actOnPlot(s,p.id,'hand').ok,false); assert.equal(p.crop,'turnip');
  assert.equal(addItem(s,'turnip',1),false); assert.equal(removeItem(s,'wood',1),true);
  assert.equal(addItem(s,'turnip',1),true);
});
test('gift consumes one item and applies a daily limit', () => {
  const s=createGame(); s.inventory.berry=2; const initial=s.friendships.mira.points;
  assert.equal(gift(s,'mira','berry').ok,true); assert.equal(s.inventory.berry,1);
  assert.ok(s.friendships.mira.points>initial); assert.equal(gift(s,'mira','berry').ok,false);
});
test('farm expansion adds plots and deducts resources only once', () => {
  const s=createGame(); s.gold=9999; s.inventory.wood=99; s.inventory.stone=99;
  const count=s.plots.length; assert.equal(expandFarm(s).ok,true); assert.ok(s.plots.length>count);
  const gold=s.gold; assert.equal(expandFarm(s).ok,false); assert.equal(s.gold,gold);
});
test('save roundtrip preserves progression and rejects invalid or malicious structures', () => {
  const s=createGame('Fajar','Sunleaf'); sleep(s); s.gold=1425;
  assert.deepEqual(decodeSave(encodeSave(s)),s);
  assert.throws(()=>decodeSave('{}'));
  assert.throws(()=>decodeSave('{broken'));
  const bad={...s,gold:-1}; assert.throws(()=>decodeSave(JSON.stringify({version:1,state:bad})));
  assert.throws(()=>decodeSave(JSON.stringify({version:1,state:{...s,inventory:{'__proto__':1,unknown_item:1}}})));
});

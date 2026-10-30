import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, gift, sell } from '../src/game/simulation.ts';
import { ITEMS } from '../src/game/content.ts';
import { DUNGEONS } from '../src/game/expansion-content.ts';
import { activateMechanism, openTreasure, attendGathering, shareBond, visitArea } from '../src/game/expeditions.ts';
import { decodeSave, encodeSave } from '../src/game/save.ts';

test('vault mechanisms and treasure are persistent, atomic and cannot pay twice',()=>{
 for(const d of DUNGEONS){const s=createGame();s.player.area=d.id;
  assert.equal(openTreasure(s,d.id).ok,false);
  for(let i=0;i<3;i++)assert.equal(activateMechanism(s,d.id,i).ok,true);
  assert.equal(activateMechanism(s,d.id,0).ok,false);
  const before=s.gold;assert.equal(openTreasure(s,d.id).ok,true);assert.equal(s.gold,before+d.gold);assert.equal(s.inventory[d.item],1);assert.equal(s.stats[d.stat],1);
  assert.equal(openTreasure(s,d.id).ok,false);assert.equal(s.gold,before+d.gold);
  assert.deepEqual(decodeSave(encodeSave(s)),s);
 }
});
test('town visits count once and gatherings respect place, date and daily limits',()=>{
 const s=createGame();visitArea(s,'aster-quay');visitArea(s,'aster-quay');assert.equal(s.stats.quay,1);
 s.player.area='aster-quay';s.inventory.carp=2;s.totalDays=2;s.day=2;
 assert.equal(attendGathering(s,'quay-fair').ok,true);assert.equal(s.inventory.carp,1);assert.equal(s.stats.communityEvents,1);
 assert.equal(attendGathering(s,'quay-fair').ok,false);s.totalDays=3;assert.equal(attendGathering(s,'quay-fair').ok,false);
});

test('a full bag cannot consume a vault reward and discoveries cannot be shipped or gifted',()=>{
 for(const d of DUNGEONS){
  const s=createGame();s.player.area=d.id;for(let i=0;i<3;i++)activateMechanism(s,d.id,i);
  s.inventory=Object.fromEntries(Object.keys(ITEMS).filter(id=>id!==d.item&&id!=='crystal').slice(0,s.capacity).map(id=>[id,1]));
  const full=structuredClone(s);assert.equal(openTreasure(s,d.id).ok,false);assert.deepEqual(s,full);
  delete s.inventory[Object.keys(s.inventory)[0]];const oneSpace=structuredClone(s);
  assert.equal(openTreasure(s,d.id).ok,false);assert.deepEqual(s,oneSpace);
  delete s.inventory[Object.keys(s.inventory)[0]];assert.equal(openTreasure(s,d.id).ok,true);
  const recovered=structuredClone(s);assert.equal(sell(s,d.item).ok,false);assert.deepEqual(s,recovered);
  assert.equal(gift(s,'mira',d.item).ok,false);assert.deepEqual(s,recovered);
 }
});
test('friendship scenes unlock in order and choices pay only once',()=>{
 const s=createGame();s.player.area='village';assert.equal(shareBond(s,'mira',0).ok,false);s.friendships.mira.points=700;
 assert.equal(shareBond(s,'mira',1).ok,false);assert.equal(shareBond(s,'mira',0).ok,true);assert.equal(shareBond(s,'mira',0).ok,false);
 assert.equal(shareBond(s,'mira',1).ok,true);assert.equal(s.stats.bondEvents,2);
});
test('pre-expansion saves gain new neighbours and fields without losing progress',()=>{
 const s=createGame();s.gold=1850;const old=JSON.parse(encodeSave(s));
 delete old.state.discoveries;delete old.state.journeyDays;
 for(const id of ['sera','tamsin','ilan'])delete old.state.friendships[id];
 for(const key of ['quay','sunridge','briar','tideVault','emberVault','skyVault','bondEvents','communityEvents'])delete old.state.stats[key];
 const migrated=decodeSave(JSON.stringify(old));assert.equal(migrated.gold,1850);assert.equal(migrated.friendships.sera.points,0);assert.deepEqual(migrated.discoveries,[]);
});

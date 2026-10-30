import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game/simulation.ts';
import { MAPS, findPath, isBlocked, FENCES } from '../src/world/maps.ts';
import type { Area } from '../src/game/types.ts';

test('every map has an unblocked spawn and reachable exits',()=>{
  for(const area of Object.keys(MAPS) as Area[]) {
    const s=createGame();s.player.area=area;[s.player.x,s.player.y]=MAPS[area].spawn;
    assert.equal(isBlocked(s,s.player.x,s.player.y),false,`${area}: spawn blocked`);
    for(const exit of MAPS[area].objects.filter(o=>o.kind==='exit')) {
      const options=[[exit.x+.5,exit.y+1.5],[exit.x+.5,exit.y+.5],[exit.x-1,exit.y+1]];
      assert.ok(options.some(([x,y])=>findPath(s,x,y).length>0),`${area}: ${exit.id} unreachable`);
    }
  }
});
test('water blocks walking, and click paths route around it',()=>{
  const s=createGame();assert.equal(isBlocked(s,36.5,5.5),true);
  const path=findPath(s,41.5,20.5);assert.ok(path.length>0);
  for(const [x,y] of path)assert.equal(isBlocked(s,x,y),false);
});

test('every building door and its return point can be approached without crossing walls',()=>{
  for(const area of Object.keys(MAPS) as Area[]){
    const s=createGame();s.player.area=area;[s.player.x,s.player.y]=MAPS[area].spawn;
    for(const o of MAPS[area].objects.filter(o=>o.kind==='building'&&o.destination)){
      assert.ok(findPath(s,o.x+.5,o.y+1.5).length,`${o.id}: door unreachable`);
    }
    for(const o of MAPS[area].objects.filter(o=>o.destinationSpawn)){
      s.player.area=o.destination!;[s.player.x,s.player.y]=o.destinationSpawn!;
      assert.equal(isBlocked(s,s.player.x,s.player.y),false,`${o.id}: return point blocked`);
      s.player.area=area;[s.player.x,s.player.y]=MAPS[area].spawn;
    }
  }
});
test('crop fences stop feet while their entrance remains walkable',()=>{
  const s=createGame();
  for(const f of FENCES.farm)assert.equal(isBlocked(s,(f.x1+f.x2)/2,(f.y1+f.y2)/2),true,'fence can be walked through');
  assert.equal(isBlocked(s,23,20),false,'crop field entrance blocked');
  assert.equal(isBlocked(s,23,19.5),false);
  const path=findPath(s,19.5,15.5);assert.ok(path.length>0,'field cannot be reached through gate');
  let previous=[s.player.x,s.player.y];
  for(const point of path){
    for(let i=1;i<=10;i++)assert.equal(isBlocked(s,previous[0]+(point[0]-previous[0])*i/10,previous[1]+(point[1]-previous[1])*i/10),false,'click route crosses a fence');
    previous=point;
  }
});
test('the farmer body cannot clip into tree trunks or farmhouse walls',()=>{
  const s=createGame();
  assert.equal(isBlocked(s,11.5,10.8),true,'tree trunk not solid');
  assert.equal(isBlocked(s,11.1,10.8),true,'body clips into trunk at edge');
  assert.equal(isBlocked(s,17.5,12.8),true,'farmhouse wall not solid');
  assert.equal(isBlocked(s,17.5,13.5),false,'farmhouse door cannot be approached');
  assert.equal(isBlocked(s,11.5,9.5),false,'canopy should allow walking behind the tree');
});
test('villagers, animals, and farm props also have solid footprints',()=>{
  const s=createGame();
  assert.equal(isBlocked(s,29,15),true,'animal can be walked through');
  assert.equal(isBlocked(s,20.5,12.9),true,'workbench can be walked through');
  s.player.area='village';assert.equal(isBlocked(s,18.5,18),true,'Mira can be walked through');
});

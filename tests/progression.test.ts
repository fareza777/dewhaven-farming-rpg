import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CROPS, QUESTS, VILLAGERS } from '../src/game/content.ts';
import { MAPS } from '../src/world/maps.ts';
import { actOnPlot, buy, careAnimal, catchFish, claimQuest, craft, createGame, gather, gift, questReady, sell, sleep, startFishing, talk, useItem } from '../src/game/simulation.ts';
import { activateMechanism, attendGathering, openTreasure, visitArea } from '../src/game/expeditions.ts';
import { DUNGEONS, GATHERINGS } from '../src/game/expansion-content.ts';
import { decodeSave, encodeSave } from '../src/game/save.ts';
import type { Area, Result } from '../src/game/types.ts';

test('all sixteen story chapters can be finished with farming, journeys, discoveries and shared tables',()=>{
  const s=createGame();
  const check=(r:Result)=>assert.equal(r.ok,true,r.message.en);
  const harvest=()=>{for(const p of s.plots)if(p.crop&&p.growth>=CROPS[p.crop].days)check(actOnPlot(s,p.id,'hand'));};
  const care=()=>{const a=s.animals[0];if(!s.inventory.feed)check(buy(s,'feed',20));if(!a.fed)check(careAnimal(s,a.id,'feed'));if(!a.petted)check(careAnimal(s,a.id,'pet'));if(a.product)check(careAnimal(s,a.id,'collect'));};
  const night=()=>{care();for(const p of s.plots)if(p.crop&&!p.watered)check(actOnPlot(s,p.id,'water'));check(sleep(s));};
  const gatherKind=(kind:'wood'|'stone'|'flower'|'berry'|'ore',amount:number)=>{
    const item=kind==='ore'?'copper':kind;
    while((s.inventory[item]||0)<amount) {
      let found=false;
      for(const area of Object.keys(MAPS) as Area[])for(const o of MAPS[area].objects.filter(o=>o.resource===kind)) {
        const key=kind==='ore'?`${o.id}-f${s.mineFloor}`:o.id;
        if(s.removed[key]!==undefined&&s.totalDays-s.removed[key]<2)continue;
        if(s.energy<8){if(s.inventory.jam)check(useItem(s,'jam'));else if(s.inventory.omelet)check(useItem(s,'omelet'));else night();}
        s.player.area=area;check(gather(s,key,kind,.8));found=true;
        if((s.inventory[item]||0)>=amount)return;
      }
      if(!found)night();
    }
  };
  const plant=(count:number)=>{
    const patches=s.plots.filter(p=>!p.crop).slice(0,count);assert.equal(patches.length,count);
    for(const p of patches){if(!p.tilled)check(actOnPlot(s,p.id,'hoe'));check(actOnPlot(s,p.id,'seed','turnip'));}
  };

  plant(3);check(claimQuest(s,'new-roots'));
  harvest();for(let i=0;i<3;i++)night();harvest();
  check(claimQuest(s,'first-harvest'));
  for(const v of VILLAGERS)check(talk(s,v.id));check(claimQuest(s,'good-neighbors'));
  for(const [id,n] of Object.entries(s.inventory))if(CROPS[id])check(sell(s,id,n));
  night();assert.ok(s.stats.earned>=1000);check(claimQuest(s,'market-day'));
  gatherKind('wood',20);gatherKind('stone',15);check(claimQuest(s,'mend-bridge'));
  assert.equal(s.upgrades.bridge,1);
  gatherKind('flower',5);gatherKind('berry',4);
  check(craft(s,'bouquet'));check(craft(s,'jam'));check(craft(s,'omelet'));
  gatherKind('ore',6);check(claimQuest(s,'garden-awakens'));
  assert.equal(s.upgrades.greenhouse,1);check(useItem(s,'sprinkler'));
  if(s.energy<20)night();plant(5);
  for(let i=0;i<3;i++)night();harvest();
  s.player.area='lake';check(startFishing(s));check(catchFish(s,.12));
  const final=QUESTS.find(q=>q.id==='lantern-promise')!;
  assert.equal(questReady(s,final),true);check(claimQuest(s,final.id));
  assert.equal(s.completed.filter(id=>QUESTS.find(q=>q.id===id)?.main).length,7);
  assert.equal(s.stats.restored,1);assert.ok(s.achievements.includes('restored'));
  assert.equal(s.inventory.ring,1);
  assert.deepEqual(decodeSave(encodeSave(s)),s);

  s.player.area='aster-quay';visitArea(s,'aster-quay');check(claimQuest(s,'letters-across-water'));
  const explore=(area:Area)=>{if(s.energy<20)night();s.player.area=area;for(let i=0;i<3;i++)check(activateMechanism(s,area,i));check(openTreasure(s,area));};
  explore('tide-vault');check(claimQuest(s,'tide-remembers'));
  s.player.area='sunridge';visitArea(s,'sunridge');
  // Grow and ship the late-game economy rather than assigning harvest/earnings stats.
  let cycles=0;
  while(s.stats.harvested<40||s.stats.earned<10000){
    assert.ok(++cycles<30,'Late-game farming failed to make progress');
    harvest();for(const [id,n]of Object.entries(s.inventory))if(CROPS[id])check(sell(s,id,n));night();
    check(buy(s,'turnip_seed',12));plant(12);for(let i=0;i<3;i++)night();harvest();
    for(const [id,n]of Object.entries(s.inventory))if(CROPS[id])check(sell(s,id,n));night();
  }
  check(claimQuest(s,'orchard-road'));
  night();for(const p of s.plots.filter(p=>!p.crop).slice(0,5)){if(!p.tilled)check(actOnPlot(s,p.id,'hoe'));check(actOnPlot(s,p.id,'seed','corn'));}
  for(let i=0;i<7;i++)night();harvest();
  gatherKind('berry',12);for(let i=0;i<3;i++)check(craft(s,'jam'));check(claimQuest(s,'a-long-table'));
  explore('ember-vault');while(s.stats.crafted<8){gatherKind('berry',4);check(craft(s,'jam'));}check(claimQuest(s,'warm-glass'));
  s.player.area='briar-hollow';visitArea(s,'briar-hollow');check(claimQuest(s,'unwritten-atlas'));
  explore('sky-vault');gatherKind('ore',30);check(claimQuest(s,'sky-road'));
  gatherKind('wood',8);for(const v of VILLAGERS.slice(0,8))check(gift(s,v.id,'wood'));
  for(const g of GATHERINGS){
    while(((s.totalDays-1)%7)+1!==g.weekday)night();
    if(s.energy<12)night();while(((s.totalDays-1)%7)+1!==g.weekday)night();
    if(g.id==='quay-fair'){s.player.area='lake';check(startFishing(s));check(catchFish(s,.6));}
    if(g.id==='archive-fair')gatherKind('flower',1);
    s.player.area=g.area;check(attendGathering(s,g.id));
  }
  check(claimQuest(s,'rooms-for-everyone'));check(claimQuest(s,'farther-lights'));
  assert.equal(s.completed.filter(id=>QUESTS.find(q=>q.id===id)?.main).length,16);
  assert.equal(s.stats.restored,2);assert.equal(s.stats.communityEvents,3);
  for(const d of DUNGEONS)assert.equal(s.inventory[d.item],1);
  assert.deepEqual(decodeSave(encodeSave(s)),s);
});

test('corn regrows, sprinklers persist, and the restored greenhouse survives season changes',()=>{
  const s=createGame();s.season=1;s.day=27;s.totalDays=55;
  s.inventory.corn_seed=1;s.inventory.sprinkler=1;s.upgrades.greenhouse=1;
  const p=s.plots[20];check(actOnPlot(s,p.id,'hoe'));check(actOnPlot(s,p.id,'seed','corn'));check(useItem(s,'sprinkler'));
  for(let day=0;day<7;day++)check(sleep(s));
  assert.equal(s.season,2);assert.equal(p.crop,'corn');assert.equal(p.watered,true);
  check(actOnPlot(s,p.id,'hand'));assert.equal(s.inventory.corn,1);
  for(let day=0;day<3;day++)check(sleep(s));
  check(actOnPlot(s,p.id,'hand'));assert.equal(s.inventory.corn,2);
  function check(r:Result){assert.equal(r.ok,true,r.message.en);}
});

import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Content');
const read=name=>JSON.parse(fs.readFileSync(path.join(root,name+'.json'),'utf8'));
const towns=read('towns'),world=read('world');
const layouts={
 'village':{size:[72,72],entry:[36,8],plaza:[37,38],
 buildings:{market:[24,13],townhall:[47,13],clothier:[10,13],'courier-lodge':[61,13],clinic:[10,29],'community-kitchen':[24,29],forge:[61,29],cafe:[24,47],ranch:[10,47],'post-office':[47,47],carpenter:[61,47],'willow-house':[10,62],'seedkeepers-cottage':[24,62],'riverstone-house':[47,62]},
 roads:[[[36,0],[36,71]],[[3,18],[69,18]],[[3,34],[69,34]],[[3,52],[69,52]],[[3,66],[69,66]],[[17,18],[17,66]],[[67,18],[67,66]],[[0,38],[36,38]],[[36,38],[71,38]],[[56,52],[56,71]]],
 water:[{rect:[53,0,3,72]}],bridges:[[51,16,7,5],[51,32,7,5],[51,36,7,5],[51,50,7,5],[51,64,7,5]],gardens:[[5,21,7,4],[22,55,8,3],[42,56,8,3]],districts:[['Seed Lane',24,18],['Letter Court',47,52],['Willow Gardens',24,66]]},
 'aster-quay':{size:[76,68],entry:[20,8],plaza:[27,38],
 buildings:{'quay-inn':[12,13],'quay-market':[28,13],'quay-storehouse':[47,13],lighthouse:[68,13],'seashell-house':[12,29],'netmakers-house':[28,29],'quay-workshop':[59,29],'harbour-office':[12,44],'quay-house':[28,44],'mariners-house':[47,44],fishmonger:[59,44]},
 roads:[[[20,0],[20,52]],[[4,18],[71,18]],[[4,34],[71,34]],[[4,48],[71,48]],[[4,52],[70,52]],[[67,18],[67,52]],[[0,48],[20,48]],[[20,36],[75,36]]],
 water:[{rect:[35,0,4,68]},{rect:[0,55,76,13]}],bridges:[[33,16,8,5],[33,32,8,7],[33,46,8,8]],gardens:[[5,22,6,3],[45,22,7,3]],districts:[['Canal Market',27,18],['Harbour Walk',47,52],['Lighthouse Court',68,18]]},
 'sunridge':{size:[68,68],entry:[34,8],plaza:[30,36],
 buildings:{'orchard-house':[24,13],'seed-library':[10,13],glasshouse:[51,13],'flower-shop':[10,29],bakery:[42,29],'orchard-barn':[57,29],presshouse:[24,45],apiary:[57,45],'orchard-cottage':[10,58],'lyras-cottage':[42,58]},
 roads:[[[34,0],[34,64]],[[4,18],[64,18]],[[4,34],[64,34]],[[4,50],[64,50]],[[4,62],[64,62]],[[17,18],[17,62]],[[62,18],[62,62]],[[34,36],[67,36]],[[54,50],[54,67]]],
 water:[{ellipse:[18,54,5,4]}],bridges:[[15,49,4,10]],gardens:[[5,22,7,3],[40,21,8,4],[25,53,6,6]],districts:[['Blossom Court',30,36],['Orchard Walk',24,50],['Glasshouse Lane',51,18]]},
 'briar-hollow':{size:[68,72],entry:[8,24],plaza:[31,38],
 buildings:{library:[24,13],'archive-house':[46,13],'guides-hut':[59,13],apothecary:[12,29],outfitters:[46,29],'drying-house':[12,47],'hollow-house':[28,47],'masons-yard':[46,47],'mountain-lodge':[59,62]},
 roads:[[[18,18],[18,66]],[[34,18],[34,66]],[[62,18],[62,66]],[[4,18],[64,18]],[[4,34],[64,34]],[[4,52],[64,52]],[[4,66],[64,66]],[[0,24],[34,24]],[[0,50],[34,50]],[[52,0],[52,18]]],
 water:[{rect:[7,0,3,72]}],bridges:[[5,16,7,5],[5,22,7,5],[5,32,7,5],[5,48,7,7],[5,64,7,5]],gardens:[[23,23,7,5],[40,55,9,4]],districts:[['Archive Court',31,24],['Stream Walk',12,38],['Mountain Steps',59,66]]}
};
const passageRows=[
 ['farm','south',64,'village','north',36],['farm','west',58,'forest','east',64],['farm','east',58,'lake','west',54],
 ['village','west',38,'forest','east',100],['village','east',38,'lake','west',90],['village','south',56,'aster-quay','north',20],
 ['forest','west',64,'cedar-downs','east',64],['cedar-downs','south',72,'sunridge','north',34],['lake','south',104,'reedwater-marsh','north',38],
 ['reedwater-marsh','east',64,'aster-quay','west',48],['forest','north',70,'copperleaf-pass','south',64],['copperleaf-pass','east',64,'briar-hollow','west',50],
 ['sunridge','east',36,'briar-hollow','west',24],['aster-quay','east',36,'saltwind-cliffs','west',64],['sunridge','south',54,'ember-trail','north',64],['briar-hollow','north',52,'observatory-rise','south',56]
];
const edge=(size,side,offset)=>side==='north'?[offset,2.8]:side==='south'?[offset,size[1]-2.8]:side==='west'?[2.8,offset]:[size[0]-2.8,offset];
for(const town of towns){const l=layouts[town.id];for(const key of ['size','entry','plaza','roads','water','bridges','gardens','districts'])town[key]=l[key];for(const b of town.buildings){if(!l.buildings[b.id])throw Error(b.id);b.position=l.buildings[b.id];}town.exits=[];for(const p of passageRows){if(p[0]===town.id)town.exits.push([p[3],...edge(l.size,p[1],p[2])]);if(p[3]===town.id)town.exits.push([p[0],...edge(l.size,p[4],p[5])]);}}
for(const exterior of world.exteriors)if(layouts[exterior.id])exterior.size=layouts[exterior.id].size;
world.passages=passageRows.map(([a,aSide,aOffset,b,bSide,bOffset])=>({a,aSide,aOffset,b,bSide,bOffset}));
world.status='Native runtime catalogue';world.designedAt='2026-10-22';
for(const [name,value] of [['towns',towns],['world',world]]){const json=JSON.stringify(value,null,2)+'\n';fs.writeFileSync(path.join(root,name+'.json'),json);fs.writeFileSync(path.resolve('docs/unity/data',name+'.json'),json);}
console.log('Authored four compact towns, 44 preserved buildings and 16 reciprocal road pairs.');

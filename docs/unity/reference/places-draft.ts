// Archived content draft for the Unity design. Not imported by the shipped web game.
import { txt, type Area, type Text, type Villager } from '../../../src/game/types.ts';

export const AVATARS = [
 {id:0,frame:'farmer/walk/down/1',sprite:'farmer',name:txt('Fieldkeeper','Penjaga ladang'),note:txt('Straw hat · canvas overalls','Topi jerami · baju kebun')},
 {id:1,frame:'chara_5/down/1',sprite:'chara_5',name:txt('Sunfarer','Penjelajah mentari'),note:txt('Copper hair · working apron','Rambut tembaga · apron')},
 {id:2,frame:'chara_17/down/1',sprite:'chara_17',name:txt('Wayfarer','Pengembara'),note:txt('Silver hair · travelling coat','Rambut perak · mantel')},
 {id:3,frame:'chara_26/down/1',sprite:'chara_26',name:txt('Trailkeeper','Penjaga jalur'),note:txt('Rust hood · leather gear','Hood merah bata · pakaian kulit')},
] as const;
export type RoomStyle='home'|'shop'|'hall'|'kitchen'|'barn'|'study'|'forge'|'glasshouse'|'inn'|'tailor'|'botanical'|'harbour';
export interface BuildingDef {room:Area;name:Text;x:number;y:number;frame:string;style:RoomStyle;owner?:string;shop?:string;icon?:string;w?:number;}
const b=(room:Area,name:string,idName:string,x:number,y:number,frame:string,style:RoomStyle,owner?:string,shop?:string,icon?:string):BuildingDef=>({room,name:txt(name,idName),x,y,frame,style,owner,shop,icon});
export const TOWN_SIZES:Partial<Record<Area,[number,number]>>={village:[88,72],'aster-quay':[96,76],sunridge:[92,76],'briar-hollow':[88,80]};
export const TOWN_BUILDINGS:Partial<Record<Area,BuildingDef[]>>={
 village:[
  b('market','Mira’s Seedhouse','Toko Benih Mira',31,27,'house_01','shop','mira','seedhouse','plant'),
  b('townhall','Dewhaven Hall','Balai Dewhaven',50,25,'house_25','hall','elias',undefined,'scroll'),
  b('cafe','The Copper Kettle','Kafe Copper Kettle',31,46,'house_06','kitchen','cleo','kettle','coffee'),
  b('ranch','Nora’s Meadow Ranch','Peternakan Nora',14,47,'house_19','barn','nora','ranch','paw-print'),
  b('forge','Copper & Coal','Bengkel Copper & Coal',67,27,'house_09','forge','orin','forge','hammer'),
  b('carpenter','Gareth’s Timberyard','Bengkel Kayu Gareth',67,47,'house_08','forge','gareth','builder','house'),
  b('clothier','Thread & Thimble','Toko Thread & Thimble',14,27,'house_10','tailor','ellis','clothier','backpack'),
  b('post-office','The Letter House','Rumah Surat',50,57,'house_24','study','aya',undefined,'envelope'),
  b('willow-house','Willow Cottage','Pondok Willow',31,62,'house_02','home'),
 ],
 'aster-quay':[
  b('quay-inn','The Saltglass Inn','Penginapan Saltglass',25,23,'house_08','inn','marin','saltglass','bed'),
  b('quay-workshop','Sera’s Boatworks','Bengkel Kapal Sera',64,27,'house_14','forge','sera',undefined,'anchor'),
  b('quay-market','The Quayside Exchange','Pasar Quayside',43,24,'house_06','shop','nemi','exchange','basket'),
  b('fishmonger','Cato’s Fresh Catch','Toko Ikan Cato',65,46,'house_15','shop','cato','fishmonger','fish'),
  b('harbour-office','The Harbour House','Kantor Pelabuhan',24,48,'house_24','harbour','basil',undefined,'compass'),
  b('quay-house','Seaglass Cottage','Pondok Seaglass',43,52,'house_12','home'),
 ],
 sunridge:[
  b('orchard-house','Tamsin’s Orchard Kitchen','Dapur Kebun Tamsin',30,26,'house_10','kitchen','tamsin','orchard','cherries'),
  b('glasshouse','The Winterglass Conservatory','Rumah Kaca Winterglass',63,25,'house_23','glasshouse'),
  b('flower-shop','Lyra’s Wildflower House','Toko Bunga Lyra',16,46,'house_05','botanical','lyra','flowers','flower'),
  b('bakery','The Hearth Pantry','Toko Hearth Pantry',48,45,'house_01','kitchen','ada','pantry','cooking-pot'),
  b('apiary','Pavel’s Garden House','Rumah Kebun Pavel',71,47,'house_17','botanical','pavel','garden','leaf'),
  b('orchard-cottage','The Orchard Cottage','Pondok Kebun',31,61,'house_03','home','cedar'),
 ],
 'briar-hollow':[
  b('library','The Briar Archive','Arsip Briar',29,25,'house_25','hall','ilan',undefined,'book-open'),
  b('archive-house','The Cartographer’s House','Rumah Kartografer',58,26,'house_08','study','jun'),
  b('apothecary','Bea’s Herb & Hearth','Toko Herbal Bea',15,47,'house_11','botanical','bea','herbalist','leaf'),
  b('outfitters','The Ridge Outfitter','Toko Ridge Outfitter',56,47,'house_09','tailor','tobin','outfitter','backpack'),
  b('mountain-lodge','The Wayfarer Lodge','Penginapan Wayfarer',72,60,'house_19','inn','vesper','lodge','mountains'),
  b('hollow-house','Heather Cottage','Pondok Heather',31,63,'house_07','home'),
 ],
};
export interface ShopDef {id:string;room:Area;owner:string;name:Text;stock:string[];upgrades:string[];animals?:boolean;open:number;close:number;}
const seeds=['turnip_seed','potato_seed','carrot_seed','cabbage_seed','radish_seed','corn_seed','pumpkin_seed','cauliflower_seed'];
const stocks:Record<string,{stock:string[];upgrades?:string[];animals?:boolean}>={
 seedhouse:{stock:[...seeds,'fertilizer']},kettle:{stock:['soup','omelet','stew','fish_dinner','jam']},ranch:{stock:['feed'],animals:true},
 forge:{stock:['copper','iron','stone'],upgrades:['tools']},builder:{stock:['wood','stone'],upgrades:['house','expansion']},clothier:{stock:['bouquet','ring'],upgrades:['backpack']},
 saltglass:{stock:['soup','fish_dinner','jam']},exchange:{stock:['turnip_seed','carrot_seed','corn_seed','feed','fertilizer','wood']},fishmonger:{stock:['carp','perch','trout','fish_dinner']},
 orchard:{stock:['jam','soup','berry','corn_seed','pumpkin_seed']},flowers:{stock:['flower','bouquet','fertilizer','carrot_seed']},pantry:{stock:['omelet','jam','soup','egg']},garden:{stock:['fertilizer','feed','cabbage_seed','cauliflower_seed']},
 herbalist:{stock:['berry','mushroom','stew','fertilizer']},outfitter:{stock:['wood','stone','copper','iron'],upgrades:['backpack']},lodge:{stock:['soup','stew','fish_dinner']},
};
export const SHOPS:ShopDef[]=Object.values(TOWN_BUILDINGS).flatMap(buildings=>buildings!.filter(d=>d.shop).map(d=>({id:d.shop!,room:d.room,owner:d.owner!,name:d.name,stock:stocks[d.shop!].stock,upgrades:stocks[d.shop!].upgrades||[],animals:stocks[d.shop!].animals,open:360,close:1200})));
export const shopAt=(area:Area)=>SHOPS.find(s=>s.room===area);
export const COUNTER:[number,number]=[14.5,12.5];
export const TRAILS:Partial<Record<Area,{name:Text;from:Area;out:[number,number];destination:Area;entry:[number,number];body:Text}>>={
 'saltwind-cliffs':{name:txt('Saltwind Cliffs','Tebing Saltwind'),from:'aster-quay',out:[83.5,34.5],destination:'tide-vault',entry:[48,13],body:txt('Beyond the harbour, stone steps descend to a sealed storehouse in the cliffs. Three counterweights guard the valley’s old tide chart.','Di luar pelabuhan, tangga batu turun ke gudang tua di tebing. Tiga penyeimbang menjaga peta pasang lembah.')},
 'ember-trail':{name:txt('Ember Trail','Jalur Ember'),from:'sunridge',out:[81.5,13.5],destination:'ember-vault',entry:[43,14],body:txt('The orchard road climbs through an abandoned quarry. At its far end stands the old glassworks, where the winter lens was made.','Jalan kebun mendaki tambang batu tua. Di ujungnya berdiri bengkel kaca tempat lensa musim dingin dibuat.')},
 'observatory-rise':{name:txt('Observatory Rise','Tanjakan Observatorium'),from:'briar-hollow',out:[76.5,13.5],destination:'sky-vault',entry:[44,12],body:txt('Follow the mountain switchbacks to the weather observatory. Its brass shutters once marked safe routes through the winter passes.','Ikuti jalur berkelok menuju observatorium cuaca. Penutup kuningannya dulu menandai rute aman di musim dingin.')},
 'copperleaf-pass':{name:txt('Copperleaf Pass','Lintasan Copperleaf'),from:'forest',out:[35.5,23.5],destination:'mine',entry:[45,13],body:txt('An old cart track leads through the pine foothills to Copperleaf Mine. Bring a pickaxe, food and space for ore.','Jalur kereta tua melewati kaki bukit menuju Tambang Copperleaf. Bawa beliung, makanan, dan ruang untuk bijih.')},
};
export const PLACE_NAMES:Partial<Record<Area,Text>>={...Object.fromEntries(Object.values(TOWN_BUILDINGS).flatMap(bs=>bs!.map(b=>[b.room,b.name]))),...Object.fromEntries(Object.entries(TRAILS).map(([id,d])=>[id,d!.name]))};
const resident=(id:string,name:string,role:string,sprite:number,area:Area,x:number,y:number,loves:string[],lines:[string,string,string]):Villager=>({id,name,role:txt(role,role),sprite:`chara_${sprite}`,area,x,y,birthday:[sprite%4,4+sprite%22],loves,color:['#ba9070','#9eafa4','#a09aae','#bfaa76'][sprite%4],romance:false,newcomer:true,dialogue:lines.map(line=>txt(line,line))});
export const TOWN_RESIDENTS:Villager[]=[
 resident('nora','Nora','Rancher',1,'village',17,52,['feed','egg','flower'],['Pip came from my first spring brood. A meal and a gentle hand will keep her laying.','The ranch has room for chickens, rabbits and truffle pigs. Look around before you choose.','I take the animals out after breakfast. They know the way to the meadow better than I do.']),
 resident('gareth','Gareth','Carpenter',2,'village',66,50,['wood','stew','stone'],['Bring the timber to my yard. We will measure the farmhouse before we start cutting.','A bigger garden needs good drainage first. The new rows belong south of your first patch.','I still use your grandmother’s measuring rule. She always marked the grain before the cut.']),
 resident('ellis','Ellis','Tailor & pack maker',7,'village',15,31,['wool','bouquet','jam'],['Set your pack on the counter. I can add pockets without making it drag on your shoulders.','I mend the delivery sacks every autumn. A loose stitch can lose a whole packet of seeds.','The clothier is west of the seedhouse. Look for the spool above the door.']),
 resident('aya','Aya','Valley courier',8,'village',48,40,['berry','flower','soup'],['The harbour letters leave at midday. I walk the east road when the bridge is dry.','Your grandmother’s address is still in my ledger. I have changed the name, not the place.','If you get turned around, open your map. The shops are marked by what they sell.']),
 resident('marin','Marin','Innkeeper',9,'aster-quay',26,37,['soup','jam','flower'],['I put the kettle on before the boats arrive. There is a clean table by the window.','Saltglass gets its name from the old sea bottles on the mantel. Most washed up after winter storms.','The cliffs are beyond the eastern harbour road. Take food; there are no shops out there.']),
 resident('cato','Cato','Fishmonger',10,'aster-quay',65,50,['carp','trout','corn'],['Today’s catch is on ice inside. The silver carp came in just before dawn.','For a fresh meal, try the Saltglass Inn. Marin knows exactly when to stop cooking a trout.','Watch the pier after rain. The small fish gather where the freshwater reaches the harbour.']),
 resident('nemi','Nemi','Harbour shopkeeper',12,'aster-quay',43,35,['wood','jam','bouquet'],['Seeds, feed and spare timber are inside. I keep a little of everything for the outlying farms.','Sera’s yard is across the canal. The bridge is wide enough for a full delivery cart.','The Tide Vault is a cliff storehouse, not a town cellar. Follow the coastal steps east.']),
 resident('basil','Basil','Harbour master',15,'aster-quay',50,60,['fish_dinner','copper','berry'],['Leave the hauling lane clear, please. The morning cargo is still coming off the pier.','These mooring posts are older than the quay. We check every rope before a storm.','Sera keeps the old delivery ledger. Ask her about the chart before you explore the cliffs.']),
 resident('lyra','Lyra','Florist',16,'sunridge',17,50,['flower','bouquet','jam'],['The pale flowers by the door like morning light. I turn their pots before opening.','Five daisies make a good bouquet. Leave the long stems so I can bind them neatly.','I walk to the orchard after closing. The blossom path smells different every season.']),
 resident('pavel','Pavel','Garden supplier',28,'sunridge',70,51,['berry','corn','wood'],['The feed sacks stay dry in the back room. Fertilizer is beside the potting bench.','The conservatory belongs to the whole town. Tamsin starts the seedlings; I repair the beds.','The old glassworks is beyond the quarry trail. The orange stone is easy to recognise.']),
 resident('ada','Ada','Pantry keeper',19,'sunridge',48,49,['egg','jam','potato'],['I have warm omelets and preserves on the counter. You can eat before heading up the trail.','Tamsin brings the fruit before breakfast. The good jars go straight into the cool pantry.','There is a little table under the south trees. I take my lunch there on clear days.']),
 resident('cedar','Cedar','Orchard hand',20,'sunridge',40,58,['corn','soup','flower'],['I am checking the lower orchard today. The roots need space between the paths.','The quarry steps begin north of the conservatory. Stay on the cut stone when it rains.','Tamsin taught me to leave one basket for the shared table. It is a habit worth keeping.']),
 resident('bea','Bea','Herbalist',21,'briar-hollow',16,51,['mushroom','berry','flower'],['I dry the herbs above the stove. The jars at the counter are ready for the mountain road.','A warm meal helps more than bravado on a cold climb. Vesper will tell you the same.','The stream runs behind the archive. That is where I gather after a wet morning.']),
 resident('tobin','Tobin','Outfitter',22,'briar-hollow',57,51,['wool','iron','stew'],['Try the pack straps before buying. You should feel the weight at your hips.','Copper, iron and trail supplies are inside. Orin handles the actual tool forging in Dewhaven.','The observatory path is north-east. It turns twice before the upper stair.']),
 resident('vesper','Vesper','Mountain guide',25,'briar-hollow',69,64,['stew','crystal','fish_dinner'],['I check the rise every morning. The last stair is exposed, so finish your climb before dark.','The observatory was built for weather, not prophecy. Its shutters still turn by hand.','There is a meal waiting at the lodge. Sit down before you start telling me how far you walked.']),
 resident('jun','Jun','Archive scribe',31,'briar-hollow',43,37,['flower','soup','wood'],['I copy the damaged pages before they fade. Ilan works out where the roads belong.','Your grandmother’s notes name people as often as places. That makes the atlas unusually useful.','The little reading garden is open. Please keep your cup on the stone ledge.']),
];

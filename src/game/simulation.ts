import { ACHIEVEMENTS, CROPS, FESTIVALS, ITEMS, QUESTS, RECIPES, VILLAGERS } from './content.ts';
import { JOURNEY_STATS } from './expansion-content.ts';
import { newAdHistory } from './ads.ts';
import { txt } from './types.ts';
import type { Animal, GameState, Plot, Quest, Requirement, Result, Skill, Tool } from './types.ts';

const ok = (en:string,id:string,extra:Partial<Result>={}):Result => ({ok:true,message:txt(en,id),...extra});
const fail = (en:string,id:string):Result => ({ok:false,message:txt(en,id)});
export const STAT_KEYS = ['planted','harvested','watered','earned','met','fish','crafted','care','mined','chopped','foraged','restored','gifts','festivals',...JOURNEY_STATS];
export function level(xp:number) { return Math.min(10,1+Math.floor(Math.sqrt(xp/100))); }
export function createPlots(expanded=false):Plot[] {
  const plots:Plot[]=[];
  for(let row=0;row<4;row++) for(let col=0;col<8;col++) plots.push({id:`plot-${row*8+col}`,x:19+col,y:15+row,tilled:col<4,crop:null,growth:0,watered:false,fertilizer:false});
  if(expanded) for(let row=0;row<3;row++) for(let col=0;col<6;col++) plots.push({id:`extra-${row*6+col}`,x:19+col,y:22+row,tilled:false,crop:null,growth:0,watered:false,fertilizer:false});
  return plots;
}
export function createGame(playerName='Robin',farmName='Amber',avatar=0,slot=0):GameState {
  const plots=createPlots();
  // A few of Grandmother's last crops welcome the player; player-grown crops count separately.
  for(const [i,crop,growth] of [[0,'turnip',3],[1,'turnip',3],[2,'carrot',4],[3,'cabbage',6],[8,'turnip',1],[9,'potato',2],[10,'carrot',2],[11,'cabbage',3],[16,'turnip',1],[17,'potato',1],[18,'carrot',1],[19,'cabbage',1]] as const) {
    plots[i].crop=crop; plots[i].growth=growth; plots[i].watered=i>3;
  }
  return {
    playerName:playerName.trim().slice(0,20)||'Robin',farmName:farmName.trim().slice(0,24)||'Amber',avatar,slot,
    day:1,season:0,year:1,totalDays:1,time:360,weather:'sunny',gold:500,energy:100,maxEnergy:100,capacity:24,
    inventory:{turnip_seed:12,carrot_seed:6,potato_seed:4,feed:8,berry:3,wood:5,stone:3},shipping:{},plots,
    animals:[{id:'chicken-1',kind:'chicken',name:'Pip',hearts:1,fed:false,petted:false,product:true,age:3}],
    friendships:Object.fromEntries(VILLAGERS.map(v=>[v.id,{points:0,talked:false,gifted:false,met:false}])),partner:null,
    skills:{farming:0,foraging:0,fishing:0,mining:0},stats:Object.fromEntries(STAT_KEYS.map(s=>[s,0])),completed:[],accepted:[],achievements:[],
    upgrades:{tools:0,expansion:0,house:0,backpack:0,sprinkler:0,scarecrow:0,bridge:0,greenhouse:0},removed:{},festivalDay:0,
    player:{x:17.5,y:14.5,area:'farm',direction:'down'},selectedSeed:'turnip',selectedTool:'hand',mineFloor:1,tutorialDone:false,discoveries:[],journeyDays:{},adHistory:newAdHistory(),
  };
}
export function addItem(s:GameState,item:string,quantity=1):boolean {
  if(!ITEMS[item]||!Number.isInteger(quantity)||quantity<=0||quantity>999|| (s.inventory[item]||0)+quantity>999) return false;
  if(!s.inventory[item] && Object.keys(s.inventory).length>=s.capacity) return false;
  s.inventory[item]=(s.inventory[item]||0)+quantity; return true;
}
export function removeItem(s:GameState,item:string,quantity=1):boolean {
  if(!ITEMS[item]||!Number.isInteger(quantity)||quantity<=0||(s.inventory[item]||0)<quantity) return false;
  s.inventory[item]-=quantity; if(s.inventory[item]===0) delete s.inventory[item]; return true;
}
export function fits(s:GameState,items:Record<string,number>,consuming:Record<string,number>={}):boolean {
  const inv={...s.inventory};
  for(const [k,n] of Object.entries(consuming)) { if((inv[k]||0)<n) return false; inv[k]-=n; if(!inv[k]) delete inv[k]; }
  for(const [k,n] of Object.entries(items)) { inv[k]=(inv[k]||0)+n; if(inv[k]>999) return false; }
  return Object.keys(inv).length<=s.capacity;
}
function spend(s:GameState,cost:number):boolean { if(s.energy<cost) return false; s.energy-=cost; return true; }
export function progress(s:GameState) { for(const a of ACHIEVEMENTS) if(s.stats[a.stat]>=a.amount&&!s.achievements.includes(a.id)) s.achievements.push(a.id); }
function xp(s:GameState,skill:Skill,amount:number) { const before=level(s.skills[skill]); s.skills[skill]+=amount; if(level(s.skills[skill])>before) {s.maxEnergy=Math.min(220,s.maxEnergy+2);s.energy=Math.min(s.maxEnergy,s.energy+5);} progress(s); }
export function actOnPlot(s:GameState,id:string,tool:Tool,seed=s.selectedSeed):Result {
  const p=s.plots.find(p=>p.id===id); if(!p) return fail('That is not a growing patch.','Itu bukan lahan tanam.');
  const cost=s.upgrades.tools?1:2;
  if(tool==='hand'&&p.crop) {
    const crop=CROPS[p.crop];
    if(p.growth<crop.days) return fail(`${crop.name.en}: ${crop.days-p.growth} more watered days.`,`${crop.name.id}: ${crop.days-p.growth} hari penyiraman lagi.`);
    if(!fits(s,{[crop.id]:1})) return fail('Your backpack is full. Make a little room first.','Tas penuh. Kosongkan satu tempat dulu.');
    if(!spend(s,1)) return fail('You need a little rest. Eat something or head home.','Kamu perlu istirahat. Makan atau pulang ke rumah.');
    addItem(s,crop.id); s.stats.harvested++; xp(s,'farming',20);
    if(crop.regrow) p.growth=crop.days-crop.regrow; else {p.crop=null;p.growth=0;}
    return ok(`A lovely ${crop.name.en.toLowerCase()}! +1 to your backpack.`,`Panen ${crop.name.id.toLowerCase()}! +1 ke dalam tas.`,{item:crop.id,amount:1});
  }
  if(tool==='hoe') {
    if(p.crop) return fail('Something is already growing here.','Ada tanaman yang tumbuh di sini.');
    if(p.tilled) return fail('This soil is ready for seeds.','Tanah ini sudah siap ditanami.');
    if(!spend(s,cost)) return fail('Take a breath. You are out of energy.','Istirahat dulu. Energimu habis.');
    p.tilled=true; xp(s,'farming',3); return ok('Fresh soil. A new beginning.','Tanah gembur. Awal yang baru.');
  }
  if(tool==='seed') {
    const crop=CROPS[seed]; if(!crop) return fail('Choose a seed from your backpack.','Pilih benih dari tas.');
    if(!p.tilled) return fail('Use the hoe to prepare the soil first.','Gunakan cangkul untuk mengolah tanah dulu.');
    if(p.crop) return fail('This patch is already planted.','Lahan ini sudah ditanami.');
    if(!s.upgrades.greenhouse&&!crop.seasons.includes(s.season)) return fail(`${crop.name.en} does not grow in this season.`,`${crop.name.id} tidak tumbuh pada musim ini.`);
    if(!(s.inventory[`${seed}_seed`]>0)) return fail('You have no more of these seeds. Visit Mira’s market.','Benih ini habis. Kunjungi pasar Mira.');
    if(!spend(s,1)) return fail('You are too tired to plant.','Kamu terlalu lelah untuk menanam.');
    removeItem(s,`${seed}_seed`); p.crop=seed;p.growth=0;p.watered=s.weather==='rain'||s.upgrades.sprinkler>0;
    s.stats.planted++;xp(s,'farming',5);return ok(`${crop.name.en} planted. Give it a little water.`,`${crop.name.id} ditanam. Jangan lupa menyiramnya.`);
  }
  if(tool==='water') {
    if(!p.tilled) return fail('Prepare the soil before watering.','Olah tanah sebelum menyiram.');
    if(p.watered) return fail('Already watered. Your plants are happy.','Sudah disiram. Tanamanmu senang.');
    if(!spend(s,cost)) return fail('Your energy is low. Have a snack.','Energi rendah. Makanlah sesuatu.');
    p.watered=true;s.stats.watered++;xp(s,'farming',2);return ok('A little water goes a long way.','Sedikit air membawa banyak manfaat.');
  }
  return fail('Choose a farming tool for this patch.','Pilih alat berkebun untuk lahan ini.');
}
export function buy(s:GameState,item:string,quantity=1):Result {
  const def=ITEMS[item]; if(!def||def.price<=0||!Number.isInteger(quantity)||quantity<1||quantity>99) return fail('Choose a valid market item and quantity.','Pilih barang dan jumlah yang benar.');
  const cost=def.price*quantity; if(s.gold<cost) return fail('A little more gold is needed.','Emasmu belum cukup.');
  if(!fits(s,{[item]:quantity})) return fail('Your backpack needs a little more room.','Tasmu perlu sedikit ruang.');
  s.gold-=cost;addItem(s,item,quantity);return ok(`${quantity} ${def.name.en.toLowerCase()} added to your backpack.`,`${quantity} ${def.name.id.toLowerCase()} ditambahkan ke tas.`,{item,amount:quantity});
}
export function sell(s:GameState,item:string,quantity=1):Result {
  const def=ITEMS[item]; if(!def||!Number.isInteger(quantity)||quantity<1||quantity>999||(s.inventory[item]||0)<quantity||(s.shipping[item]||0)+quantity>999) return fail('You do not have that quantity to ship.','Jumlah barang yang dikirim tidak tersedia.');
  if(!def.sell)return fail('This discovery belongs with the atlas.','Penemuan ini adalah bagian dari atlas.');
  removeItem(s,item,quantity); s.shipping[item]=(s.shipping[item]||0)+quantity;
  return ok(`Ready to ship. ${def.sell*quantity} gold arrives tomorrow.`,`Siap dikirim. ${def.sell*quantity} emas tiba besok.`,{amount:def.sell*quantity});
}
export function shippingValue(s:GameState) { return Object.entries(s.shipping).reduce((n,[id,q])=>n+(ITEMS[id]?.sell||0)*q,0); }
export function sleep(s:GameState,exhausted=false):Result {
  const earnings=shippingValue(s);s.gold+=earnings;s.stats.earned+=earnings;s.shipping={};
  const loss=exhausted?Math.min(150,Math.floor(s.gold*.1)):0;s.gold-=loss;
  for(const p of s.plots) if(p.crop&&p.watered) p.growth=Math.min(CROPS[p.crop].days,p.growth+(p.fertilizer?2:1));
  for(const a of s.animals) {a.product=a.fed&&a.age>=2;a.age++;if(!a.fed)a.hearts=Math.max(0,a.hearts-.1);a.fed=false;a.petted=false;}
  for(const f of Object.values(s.friendships)) {f.talked=false;f.gifted=false;}
  s.day++;s.totalDays++;if(s.day>28) {s.day=1;s.season++;if(s.season>3){s.season=0;s.year++;}}
  const r=((s.totalDays*31+7)%100); s.weather=s.season===3?(r<40?'snow':'cloudy'):(r<28?'rain':r<45?'cloudy':'sunny');
  for(const p of s.plots) {if(p.crop&&!s.upgrades.greenhouse&&!CROPS[p.crop].seasons.includes(s.season)){p.crop=null;p.growth=0;}p.watered=s.weather==='rain'||s.upgrades.sprinkler>0;}
  s.energy=exhausted?Math.round(s.maxEnergy*.75):s.maxEnergy;s.time=360;s.player={x:17,y:13.5,area:'farm',direction:'down'};progress(s);
  return ok(earnings?`Good morning! Your shipment earned ${earnings} gold.${loss?` You lost ${loss} gold after passing out.`:''}`:`A fresh morning. Your little life is waiting.${loss?` Passing out cost ${loss} gold.`:''}`,
    earnings?`Selamat pagi! Pengirimanmu menghasilkan ${earnings} emas.${loss?` Kamu kehilangan ${loss} emas karena kelelahan.`:''}`:`Pagi yang baru. Kehidupan kecilmu menanti.${loss?` Kelelahan memotong ${loss} emas.`:''}`,{amount:earnings});
}
export function requirementProgress(s:GameState,r:Requirement):number { return r.stat?(s.stats[r.stat]||0):r.item?(s.inventory[r.item]||0):r.upgrade?(s.upgrades[r.upgrade]||0):0; }
export function availableQuest(s:GameState,q:Quest) {
  if(s.completed.includes(q.id))return false;
  if(!q.main)return true;
  const main=QUESTS.filter(q=>q.main);const index=main.findIndex(m=>m.id===q.id);return index===0||s.completed.includes(main[index-1].id);
}
export function questReady(s:GameState,q:Quest) { return availableQuest(s,q)&&q.requirements.every(r=>requirementProgress(s,r)>=r.amount); }
export function currentQuest(s:GameState) {return QUESTS.find(q=>q.main&&!s.completed.includes(q.id));}
export function claimQuest(s:GameState,id:string):Result {
  const q=QUESTS.find(q=>q.id===id);if(!q||!questReady(s,q)) return fail('There is a little more to do before this chapter is complete.','Masih ada yang harus dikerjakan sebelum quest ini selesai.');
  const consumption=Object.fromEntries(q.requirements.filter(r=>r.item).map(r=>[r.item!,r.amount]));
  if(!fits(s,q.reward.items||{},consumption))return fail('Make room for your quest rewards first.','Kosongkan tempat untuk hadiah quest dulu.');
  for(const [id,n] of Object.entries(consumption))removeItem(s,id,n);
  s.gold+=q.reward.gold;for(const [id,n] of Object.entries(q.reward.items||{}))addItem(s,id,n);s.completed.push(id);
  if(id==='mend-bridge')s.upgrades.bridge=1;
  if(id==='garden-awakens')s.upgrades.greenhouse=1;
  if(id==='lantern-promise') {s.stats.restored=1;s.festivalDay=s.totalDays;}
  if(id==='farther-lights')s.stats.restored=2;
  const giver=VILLAGERS.find(v=>v.name===q.giver);if(giver)s.friendships[giver.id].points=Math.min(1000,s.friendships[giver.id].points+35);
  progress(s);return ok(`Chapter complete! +${q.reward.gold} gold.`,`Quest selesai! +${q.reward.gold} emas.`,{amount:q.reward.gold});
}
export function talk(s:GameState,id:string):Result {
  const v=VILLAGERS.find(v=>v.id===id);const f=s.friendships[id];if(!v||!f)return fail('No one is here.','Tidak ada orang di sini.');
  if(f.talked)return fail(`${v.name} is happy you stopped by. Come back tomorrow for more.`,`${v.name} senang kamu mampir. Besok kita mengobrol lagi.`);
  if(!f.met){s.stats.met++;f.met=true;}f.points=Math.min(1000,f.points+20);f.talked=true;progress(s);
  return {ok:true,message:v.dialogue[(s.totalDays+Math.floor(f.points/100))%v.dialogue.length]};
}
export function gift(s:GameState,id:string,item:string):Result {
  const v=VILLAGERS.find(v=>v.id===id);const f=s.friendships[id];if(!v||!f||!ITEMS[item]||!s.inventory[item])return fail('Choose a gift you have in your backpack.','Pilih hadiah yang ada di tas.');
  if(f.gifted)return fail('One thoughtful gift each day is plenty.','Satu hadiah penuh perhatian per hari sudah cukup.');
  if(!ITEMS[item].sell)return fail('Keep this discovery with the atlas.','Simpan penemuan ini bersama atlas.');
  const loved=v.loves.includes(item);const birthday=v.birthday[0]===s.season&&v.birthday[1]===s.day;const points=(loved?65:25)*(birthday?2:1);
  if(!f.met){s.stats.met++;f.met=true;}removeItem(s,item);f.points=Math.min(1000,f.points+points);f.gifted=true;s.stats.gifts++;progress(s);
  return ok(loved?`${v.name} loves your gift! +${points} friendship.`:`${v.name} appreciates your gift. +${points} friendship.`,loved?`${v.name} menyukai hadiahmu! +${points} pertemanan.`:`${v.name} menghargai hadiahmu. +${points} pertemanan.`);
}
export function propose(s:GameState,id:string):Result {
  const v=VILLAGERS.find(v=>v.id===id);if(!v?.romance||s.partner||(s.friendships[id]?.points||0)<800||!s.inventory.ring)return fail('A ring, eight hearts, and a shared story come first.','Perlu cincin, delapan hati, dan sebuah kisah bersama.');
  removeItem(s,'ring');s.partner=id;return ok(`${v.name} said yes. A new chapter, together.`,`${v.name} berkata ya. Bab baru dimulai bersama.`);
}
export function careAnimal(s:GameState,id:string,action:'pet'|'feed'|'collect'):Result {
  const a=s.animals.find(a=>a.id===id);if(!a)return fail('This animal could not be found.','Hewan tidak ditemukan.');
  if(action==='pet') {if(a.petted)return fail(`${a.name} already feels loved today.`,`${a.name} sudah disayangi hari ini.`);a.petted=true;a.hearts=Math.min(10,a.hearts+.2);s.stats.care++;progress(s);return ok(`${a.name} feels loved.`,`${a.name} merasa disayangi.`);}
  if(action==='feed') {if(a.fed)return fail(`${a.name} has a full tummy.`,`${a.name} sudah kenyang.`);if(!s.inventory.feed)return fail('Buy or craft some animal feed first.','Beli atau buat pakan ternak dulu.');removeItem(s,'feed');a.fed=true;s.stats.care++;progress(s);return ok(`${a.name} is fed and happy.`,`${a.name} sudah makan dan senang.`);}
  const item=a.kind==='chicken'?'egg':a.kind==='pig'?'truffle':'wool';
  if(!a.product)return fail('No produce yet. Feed daily and check back tomorrow.','Belum ada hasil. Beri pakan setiap hari dan periksa besok.');
  if(!addItem(s,item))return fail('Make room in your backpack first.','Kosongkan ruang di tas dulu.');
  a.product=false;xp(s,'farming',12);return ok(`Thank you, ${a.name}! +1 ${ITEMS[item].name.en.toLowerCase()}.`,`Terima kasih, ${a.name}! +1 ${ITEMS[item].name.id.toLowerCase()}.`,{item,amount:1});
}
export function buyAnimal(s:GameState,kind:Animal['kind'],name:string):Result {
  const cost=kind==='chicken'?350:kind==='pig'?900:600;
  if(s.animals.length>=8)return fail('Your barn is home to eight animals already.','Kandang sudah dihuni delapan hewan.');
  if(s.gold<cost)return fail('You need a little more gold for a new friend.','Perlu sedikit emas lagi untuk teman baru.');
  s.gold-=cost;let id=`${kind}-${s.totalDays}-${s.animals.length}`;while(s.animals.some(a=>a.id===id))id+='a';
  s.animals.push({id,kind,name:name.trim().slice(0,16)||(kind==='chicken'?'Poppy':kind==='pig'?'Truffle':'Cloud'),hearts:0,fed:false,petted:false,product:false,age:0});
  return ok('A new little friend has arrived at your homestead.','Teman kecil baru telah tiba di kebunmu.');
}
export function gather(s:GameState,id:string,kind:'wood'|'stone'|'berry'|'flower'|'mushroom'|'ore',roll=.5):Result {
  if(s.removed[id]!==undefined&&s.totalDays-s.removed[id]<2)return fail('Let nature have a little time to recover.','Beri alam waktu untuk pulih.');
  const item=kind==='ore'?(roll<.12&&s.mineFloor>=3?'crystal':roll<.4&&s.mineFloor>=2?'iron':'copper'):kind;
  const cost=kind==='wood'?5:kind==='ore'||kind==='stone'?4:1;
  const quantity=kind==='wood'||kind==='stone'?2+s.upgrades.tools:1;
  if(!fits(s,{[item]:quantity}))return fail('Your backpack is full.','Tasmu penuh.');
  if(!spend(s,Math.max(1,cost-s.upgrades.tools)))return fail('You need energy. Eat a snack or sleep at home.','Kamu perlu energi. Makan atau tidur di rumah.');
  addItem(s,item,quantity);s.removed[id]=s.totalDays;
  const skill=kind==='ore'||kind==='stone'?'mining':'foraging';xp(s,skill,kind==='ore'?18:12);
  s.stats[kind==='wood'?'chopped':kind==='ore'||kind==='stone'?'mined':'foraged']++;
  return ok(`+${quantity} ${ITEMS[item].name.en.toLowerCase()}. A little gift from the valley.`,`+${quantity} ${ITEMS[item].name.id.toLowerCase()}. Hadiah kecil dari lembah.`,{item,amount:quantity});
}
export function startFishing(s:GameState):Result {
  if(s.player.area!=='lake'&&s.player.area!=='farm')return fail('Find a quiet spot by the water first.','Cari tempat tenang di tepi air dulu.');
  if(!spend(s,4))return fail('Fishing needs a little energy. Have a snack first.','Memancing perlu energi. Makan dulu.');
  s.time+=10;return ok('Wait for the bite, then keep the marker in the green zone.','Tunggu ikan, lalu tahan penanda di zona hijau.');
}
export function catchFish(s:GameState,roll=Math.random()):Result {
  const item=s.time>=1080&&roll<.25?'moonfish':roll<.22?'trout':roll<.55?'perch':'carp';
  if(!addItem(s,item))return fail('Your backpack is full. The fish swims free.','Tas penuh. Ikan berenang bebas.');
  s.stats.fish++;xp(s,'fishing',25);return ok(`Caught a ${ITEMS[item].name.en.toLowerCase()}!`,`Berhasil menangkap ${ITEMS[item].name.id.toLowerCase()}!`,{item,amount:1});
}
export function craft(s:GameState,id:string):Result {
  const r=RECIPES.find(r=>r.id===id);if(!r)return fail('This recipe is not in your notebook.','Resep ini tidak ada di buku.');
  if(r.skill&&level(s.skills[r.skill])<(r.level||1))return fail(`${r.skill} level ${r.level} is needed.`,`Perlu level ${r.level} untuk ${r.skill}.`);
  if(Object.entries(r.ingredients).some(([k,n])=>(s.inventory[k]||0)<n))return fail('A few ingredients are still missing.','Masih ada bahan yang kurang.');
  if(!fits(s,{[r.output]:r.quantity},r.ingredients))return fail('Make room for your creation first.','Kosongkan tempat untuk hasil kreasi dulu.');
  for(const [k,n] of Object.entries(r.ingredients))removeItem(s,k,n);addItem(s,r.output,r.quantity);s.stats.crafted++;xp(s,'farming',10);
  return ok(`${r.name.en} made with love.`,`${r.name.id} dibuat dengan cinta.`,{item:r.output,amount:r.quantity});
}
export function useItem(s:GameState,item:string):Result {
  const def=ITEMS[item];if(!def||!s.inventory[item])return fail('That item is not in your backpack.','Barang itu tidak ada di tas.');
  if(def.energy) {if(s.energy>=s.maxEnergy)return fail('You are already full of energy.','Energimu masih penuh.');removeItem(s,item);s.energy=Math.min(s.maxEnergy,s.energy+def.energy);return ok(`That hit the spot. +${def.energy} energy.`,`Enak sekali. +${def.energy} energi.`);}
  if(item==='sprinkler'||item==='scarecrow') {if(s.upgrades[item])return fail('Your farm already has one.','Kebunmu sudah memilikinya.');removeItem(s,item);s.upgrades[item]=1;if(item==='sprinkler')for(const p of s.plots)p.watered=true;else for(const p of s.plots)if(p.crop)p.growth=Math.min(CROPS[p.crop].days,p.growth+1);return ok('Placed on your farm. A little help for every morning.','Dipasang di kebun. Bantuan kecil setiap pagi.');}
  if(item==='fertilizer') {const p=s.plots.find(p=>p.crop&&!p.fertilizer);if(!p)return fail('Plant a crop that is not fertilized first.','Tanam benih yang belum dipupuk dulu.');removeItem(s,item);p.fertilizer=true;return ok('Your next growing crop gets a little boost.','Tanamanmu mendapat dorongan pertumbuhan.');}
  if(def.category==='seed') {s.selectedSeed=item.replace('_seed','');s.selectedTool='seed';return ok('Seed selected. Find a freshly tilled patch.','Benih dipilih. Cari lahan yang sudah dicangkul.');}
  return fail('Keep this for a recipe, a gift, or the shipping bin.','Simpan untuk resep, hadiah, atau kotak pengiriman.');
}
export function expandFarm(s:GameState):Result {
  if(s.upgrades.expansion)return fail('Your growing patch is already expanded.','Lahanmu sudah diperluas.');
  if(s.gold<800||(s.inventory.wood||0)<15||(s.inventory.stone||0)<10)return fail('Expansion needs 800 gold, 15 timber and 10 stone.','Perlu 800 emas, 15 kayu, dan 10 batu untuk memperluas lahan.');
  s.gold-=800;removeItem(s,'wood',15);removeItem(s,'stone',10);s.upgrades.expansion=1;s.plots.push(...createPlots(true).slice(32));return ok('Room for eighteen more little beginnings.','Ruang untuk delapan belas tanaman baru.');
}
export function upgrade(s:GameState,kind:'tools'|'backpack'|'house'):Result {
  if(s.upgrades[kind]>=2)return fail('This upgrade is already complete.','Peningkatan ini sudah maksimal.');
  const stage=s.upgrades[kind];const cost=(kind==='tools'?700:kind==='house'?1400:450)*(stage+1);
  const material=kind==='tools'?'copper':'wood';const n=kind==='backpack'?0:kind==='tools'?5*(stage+1):20*(stage+1);
  if(s.gold<cost||(s.inventory[material]||0)<n)return fail(`You need ${cost} gold${n?` and ${n} ${ITEMS[material].name.en.toLowerCase()}`:''}.`,`Perlu ${cost} emas${n?` dan ${n} ${ITEMS[material].name.id.toLowerCase()}`:''}.`);
  s.gold-=cost;if(n)removeItem(s,material,n);s.upgrades[kind]++;
  if(kind==='backpack')s.capacity+=8;if(kind==='house'){s.maxEnergy+=15;s.energy=Math.min(s.maxEnergy,s.energy+15);}
  return ok('A little improvement, a whole lot of possibility.','Sedikit peningkatan, banyak kemungkinan baru.');
}
export function attendFestival(s:GameState):Result {
  const f=FESTIVALS.find(f=>f.season===s.season&&f.day===s.day);if(!f)return fail('The next festival is on the 14th. Check your calendar.','Festival berikutnya tanggal 14. Periksa kalender.');
  if(s.festivalDay===s.totalDays)return fail('You have already shared this special day.','Kamu sudah merayakan hari istimewa ini.');
  const item=s.season===0?'flower':s.season===1?'carp':s.season===2?'corn':'berry';
  if(!s.inventory[item])return fail(`Bring a ${ITEMS[item].name.en.toLowerCase()} to share.`,`Bawa ${ITEMS[item].name.id.toLowerCase()} untuk berbagi.`);
  removeItem(s,item);s.festivalDay=s.totalDays;s.stats.festivals++;s.gold+=300;s.energy=s.maxEnergy;
  for(const f of Object.values(s.friendships))f.points=Math.min(1000,f.points+50);
  return ok('A day to remember. +300 gold and friendship with everyone.','Hari yang tak terlupakan. +300 emas dan pertemanan dengan semua warga.');
}

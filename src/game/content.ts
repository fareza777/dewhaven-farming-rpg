import { txt } from './types.ts';
import type { Area, Crop, Item, Quest, Recipe, Villager } from './types.ts';
import { EXPANSION_AREAS, EXTRA_QUESTS, EXTRA_VILLAGERS } from './expansion-content.ts';

export const SEASONS = [txt('Spring','Musim Semi'),txt('Summer','Musim Panas'),txt('Autumn','Musim Gugur'),txt('Winter','Musim Dingin')];
export const AREAS = { farm: txt('Your Homestead','Kebunmu'), village: txt('Dewhaven Village','Desa Dewhaven'), forest: txt('Whispering Woods','Hutan Berbisik'), lake: txt('Moonwater Lake','Danau Moonwater'), mine: txt('Copperleaf Mine','Tambang Copperleaf'),...EXPANSION_AREAS } as Record<Area,ReturnType<typeof txt>>;
export const CROPS: Record<string, Crop> = {
  turnip: {id:'turnip',name:txt('Turnip','Lobak'),days:3,seasons:[0,2],sell:65,seed:20,sheet:'crop_06',stages:5},
  potato: {id:'potato',name:txt('Potato','Kentang'),days:5,seasons:[0],sell:110,seed:40,sheet:'crop_05',stages:5},
  carrot: {id:'carrot',name:txt('Carrot','Wortel'),days:4,seasons:[0,2],sell:95,seed:30,sheet:'crop_15',stages:6},
  cabbage: {id:'cabbage',name:txt('Cabbage','Kubis'),days:6,seasons:[0,1],sell:180,seed:60,sheet:'crop_16',stages:6},
  radish: {id:'radish',name:txt('Radish','Radis'),days:4,seasons:[1,2],sell:100,seed:35,sheet:'crop_11',stages:6},
  corn: {id:'corn',name:txt('Sweet corn','Jagung'),days:7,seasons:[1,2],sell:150,seed:65,sheet:'crop_08',stages:6,regrow:3},
  pumpkin: {id:'pumpkin',name:txt('Pumpkin','Labu'),days:8,seasons:[2],sell:280,seed:85,sheet:'crop_07',stages:6},
  cauliflower: {id:'cauliflower',name:txt('Cauliflower','Kembang kol'),days:8,seasons:[0],sell:250,seed:80,sheet:'crop_17',stages:6},
};
export const ITEMS: Record<string, Item> = {};
const cropColors: Record<string,string> = {turnip:'#efe1d0',potato:'#b78958',carrot:'#e48842',cabbage:'#87aa5b',radish:'#cb6579',corn:'#e4c154',pumpkin:'#d38542',cauliflower:'#c7d8a3'};
for (const crop of Object.values(CROPS)) {
  ITEMS[crop.id]={id:crop.id,name:crop.name,category:'crop',price:0,sell:crop.sell,icon:'plant',color:cropColors[crop.id],frame:`${crop.sheet}/${crop.stages-1}`};
  ITEMS[`${crop.id}_seed`]={id:`${crop.id}_seed`,name:txt(`${crop.name.en} seeds`,`Benih ${crop.name.id.toLowerCase()}`),category:'seed',price:crop.seed,sell:Math.floor(crop.seed/2),icon:'bag-simple',color:cropColors[crop.id]};
}
function item(id:string,en:string,idName:string,category:Item['category'],price:number,sell:number,icon:string,color:string,energy?:number) {
  ITEMS[id]={id,name:txt(en,idName),category,price,sell,icon,color,energy};
}
item('wood','Timber','Kayu','material',25,8,'tree','#a17a50');
item('stone','Stone','Batu','material',20,6,'cube','#8a9296');
item('copper','Copper ore','Bijih tembaga','material',90,35,'diamond','#c98458');
item('iron','Iron ore','Bijih besi','material',150,55,'diamond','#82969e');
item('crystal','Moon crystal','Kristal bulan','material',0,210,'diamond','#9abebf');
item('berry','Wild berries','Buah beri','food',0,25,'cherries','#bf7082',12);
item('mushroom','Forest mushroom','Jamur hutan','food',0,40,'acorn','#ad8562',10);
item('flower','Daisy','Bunga daisy','special',0,15,'flower','#e2bf62');
item('egg','Fresh egg','Telur segar','food',0,45,'egg','#e5d9b9',8);
item('truffle','Wild truffle','Truffle','food',0,180,'acorn','#9c8473',16);
item('wool','Soft wool','Wol lembut','material',0,95,'cloud','#dfddcb');
item('feed','Animal feed','Pakan ternak','animal',15,5,'grains','#c2ab6c');
item('fertilizer','Fertilizer','Pupuk','special',50,20,'sparkle','#9baa62');
item('sprinkler','Copper sprinkler','Sprinkler tembaga','special',0,250,'drop','#8cacb2');
item('scarecrow','Scarecrow','Orang-orangan sawah','special',0,160,'person-arms-spread','#a3885a');
item('bouquet','Wildflower bouquet','Buket bunga','special',0,120,'flower','#bd93a5');
item('ring','Moonstone ring','Cincin batu bulan','special',0,800,'circle','#d6b25c');
item('soup','Garden soup','Sup kebun','food',0,180,'bowl-food','#c5a76d',40);
item('omelet','Farmhouse omelet','Omelet farm','food',0,150,'cooking-pot','#debc69',32);
item('stew','Woodland stew','Semur hutan','food',0,230,'bowl-food','#9b8b69',55);
item('fish_dinner','Lakeside dinner','Hidangan ikan','food',0,240,'fish','#99aea0',45);
item('jam','Berry preserves','Selai beri','food',0,140,'jar','#bb7b8d',24);
item('carp','Silver carp','Ikan mas perak','fish',0,65,'fish','#a0b6bb');
item('perch','Golden perch','Ikan perch','fish',0,95,'fish','#c7b567');
item('trout','Rainbow trout','Ikan trout','fish',0,145,'fish','#b59cab');
item('moonfish','Moonfish','Ikan bulan','fish',0,310,'fish','#9aabbf');
item('ancient_chart','The tide chart','Peta pasang','special',0,0,'map-trifold','#c9af80');
item('glass_lens','The ember lens','Lensa bara','special',0,0,'magnifying-glass','#b4c7cd');
item('brass_compass','The sky compass','Kompas langit','special',0,0,'compass','#b99b62');

export const VILLAGERS: Villager[] = [
  {id:'mira',name:'Mira',role:txt('The seedkeeper','Penjaga benih'),sprite:'chara_13',area:'village',x:18,y:17,birthday:[0,8],loves:['flower','bouquet','turnip'],color:'#b8907c',romance:true,dialogue:[txt('You can tell a lot about a person by the way they tend a garden. I think yours will be lovely.','Kebun mencerminkan orang yang merawatnya. Kebunmu pasti akan indah.'),txt('A little rain, a little patience. That is all a seed really asks of us.','Sedikit hujan, sedikit kesabaran. Hanya itu yang diminta benih.'),txt('Grandmother used to leave flowers by the old well. Maybe we can bring that tradition back.','Nenek dulu menaruh bunga di sumur tua. Mungkin kita bisa menghidupkan tradisi itu kembali.')]},
  {id:'rowan',name:'Rowan',role:txt('Woodland ranger','Penjaga hutan'),sprite:'chara_29',area:'forest',x:20,y:17,birthday:[2,12],loves:['mushroom','stew','wood'],color:'#82a47a',romance:true,dialogue:[txt('The woods have their own rhythm. Walk slowly, and they will show you their secrets.','Hutan punya iramanya sendiri. Berjalanlah perlahan untuk menemukan rahasianya.'),txt('I marked a few berry bushes along the trail. Help yourself, but leave some for the birds.','Aku menandai semak beri di jalur. Ambil secukupnya dan sisakan untuk burung.'),txt('When the valley blooms again, I want to see it with someone who understands this place.','Saat lembah kembali mekar, aku ingin melihatnya bersama orang yang memahami tempat ini.')]},
  {id:'elias',name:'Elias',role:txt('Village mayor','Kepala desa'),sprite:'chara_3',area:'village',x:29,y:15,birthday:[1,5],loves:['soup','corn','jam'],color:'#9b99b0',romance:false,dialogue:[txt('Your grandmother believed this valley could become a home for everyone. You have her spirit.','Nenekmu percaya lembah ini bisa menjadi rumah bagi semua orang. Kamu mewarisi semangatnya.'),txt('The old community garden has seen better days. Every harvest gets us a little closer.','Kebun komunitas tua perlu dirawat. Setiap panen membawa kita lebih dekat.'),txt('The Lantern Festival is our promise to one another: no one in Dewhaven is alone.','Festival Lentera adalah janji kami: tak seorang pun di Dewhaven sendirian.')]},
  {id:'cleo',name:'Cleo',role:txt('Café owner','Pemilik kafe'),sprite:'chara_18',area:'village',x:24,y:21,birthday:[1,19],loves:['egg','berry','jam'],color:'#7e9ab3',romance:true,dialogue:[txt('Come in whenever you like. There is always room at my table, especially for a farmer.','Mampirlah kapan saja. Selalu ada kursi di mejaku, terutama untuk seorang petani.'),txt('Nothing beats cooking with something you grew yourself. Try the farmhouse omelet!','Memasak hasil kebun sendiri rasanya paling enak. Cobalah omelet farm!'),txt('I have a recipe for every season. The best ingredient is still good company.','Aku punya resep untuk setiap musim. Bahan terbaik tetap teman yang baik.')]},
  {id:'finn',name:'Finn',role:txt('Lake wanderer','Penjelajah danau'),sprite:'chara_23',area:'lake',x:20,y:20,birthday:[0,22],loves:['trout','moonfish','fish_dinner'],color:'#85aaa9',romance:true,dialogue:[txt('Watch the float, not the clock. The lake rewards a calm heart.','Perhatikan pelampung, bukan jam. Danau menghargai hati yang tenang.'),txt('After sunset, something silver glides beneath the lilies. A moonfish, if the stories are true.','Setelah senja, sesuatu berwarna perak berenang di bawah teratai. Ikan bulan, menurut cerita.'),txt('The bridge is a fine place to sit together and say absolutely nothing.','Jembatan adalah tempat yang indah untuk duduk bersama tanpa berkata apa pun.')]},
  {id:'orin',name:'Orin',role:txt('Blacksmith','Pandai besi'),sprite:'chara_4',area:'mine',x:16,y:19,birthday:[3,11],loves:['iron','crystal','stew'],color:'#b89068',romance:false,dialogue:[txt('Good tools deserve good hands. Bring me copper and we will give yours a little more strength.','Alat bagus layak di tangan yang baik. Bawa tembaga agar alatmu semakin kuat.'),txt('There is moonstone deep in the mine. Bring a full stomach and a steady pickaxe.','Ada batu bulan di kedalaman tambang. Bawa perut kenyang dan beliung yang kuat.'),txt('Stone remembers everything. This valley has a few stories left to tell.','Batu mengingat segalanya. Lembah ini masih punya cerita untuk dibagikan.')]},
];

export const QUESTS: Quest[] = [
 {id:'new-roots',main:true,title:txt('New roots','Tempat untuk berakar'),description:txt('Grandmother left you more than a farm. Plant 3 seeds and begin your own little chapter.','Nenek meninggalkan lebih dari sekadar kebun. Tanam 3 benih dan mulai kisahmu.'),giver:'Grandmother’s letter',requirements:[{stat:'planted',amount:3}],reward:{gold:150,items:{carrot_seed:4}}},
 {id:'first-harvest',main:true,title:txt('First harvest','Panen pertama'),description:txt('Harvest 5 crops. Every small beginning deserves a little celebration.','Panen 5 tanaman. Setiap awal kecil layak dirayakan.'),giver:'Mira',requirements:[{stat:'harvested',amount:5}],reward:{gold:300,items:{potato_seed:5}}},
 {id:'good-neighbors',main:true,title:txt('Meet the valley','Mengenal para tetangga'),description:txt('Meet six neighbours. A home is made of the people who share it.','Kenali enam tetangga. Orang-oranglah yang membuat rumah terasa hangat.'),giver:'Elias',requirements:[{stat:'met',amount:6}],reward:{gold:400,items:{feed:10}}},
 {id:'market-day',main:true,title:txt('Market day','Dari kebun dengan cinta'),description:txt('Earn 1,000 gold from shipping. The valley is ready to taste what you have grown.','Hasilkan 1.000 emas dari pengiriman. Lembah menanti hasil kebunmu.'),giver:'Cleo',requirements:[{stat:'earned',amount:1000}],reward:{gold:600,items:{fertilizer:5}}},
 {id:'mend-bridge',main:true,title:txt('The old bridge','Jembatan penghubung'),description:txt('Bring 20 timber and 15 stone to repair the old village bridge.','Bawa 20 kayu dan 15 batu untuk memperbaiki jembatan desa.'),giver:'Rowan',requirements:[{item:'wood',amount:20},{item:'stone',amount:15}],reward:{gold:750}},
 {id:'garden-awakens',main:true,title:txt('Community garden','Kebun kembali hidup'),description:txt('Craft 3 things and bring 6 copper ore. Help Orin restore the community greenhouse.','Buat 3 barang dan bawa 6 bijih tembaga. Bantu Orin memperbaiki rumah kaca.'),giver:'Orin',requirements:[{stat:'crafted',amount:3},{item:'copper',amount:6}],reward:{gold:1000,items:{sprinkler:1}}},
 {id:'lantern-promise',main:true,title:txt('The lantern promise','Janji lentera'),description:txt('Share a feast: 5 crops, 3 fresh eggs, a trout and a bouquet. Bring light back to Dewhaven.','Siapkan perjamuan: 5 lobak, 3 telur, seekor trout dan buket bunga. Terangi Dewhaven lagi.'),giver:'Elias',requirements:[{item:'turnip',amount:5},{item:'egg',amount:3},{item:'trout',amount:1},{item:'bouquet',amount:1}],reward:{gold:2500,items:{ring:1}}},
 {id:'miras-basket',main:false,title:txt('Mira’s market basket','Keranjang Mira'),description:txt('Mira needs 3 turnips for a neighbor who cannot make it to the market.','Mira perlu 3 lobak untuk tetangga yang tak bisa pergi ke pasar.'),giver:'Mira',requirements:[{item:'turnip',amount:3}],reward:{gold:300,items:{flower:3}}},
 {id:'breakfast-club',main:false,title:txt('The breakfast club','Klub sarapan'),description:txt('Bring Cleo 3 eggs. Tomorrow’s breakfast is on you.','Bawakan 3 telur untuk Cleo. Sarapan besok berkat bantuanmu.'),giver:'Cleo',requirements:[{item:'egg',amount:3}],reward:{gold:250,items:{omelet:1}}},
 {id:'woodland-kindness',main:false,title:txt('A little woodland kindness','Kebaikan di hutan'),description:txt('Bring Rowan 5 berries and 2 mushrooms for the woodland picnic.','Bawa 5 beri dan 2 jamur untuk piknik Rowan.'),giver:'Rowan',requirements:[{item:'berry',amount:5},{item:'mushroom',amount:2}],reward:{gold:320,items:{stew:1}}},
 {id:'finns-catch',main:false,title:txt('The one that got away','Ikan yang terlepas'),description:txt('Catch 5 fish. Finn thinks you might be a natural.','Tangkap 5 ikan. Finn yakin kamu punya bakat.'),giver:'Finn',requirements:[{stat:'fish',amount:5}],reward:{gold:350,items:{fish_dinner:1}}},
 {id:'stone-song',main:false,title:txt('The song of stone','Nyanyian batu'),description:txt('Orin needs 8 iron ore for the town’s new bell.','Orin perlu 8 bijih besi untuk lonceng desa.'),giver:'Orin',requirements:[{item:'iron',amount:8}],reward:{gold:800,items:{crystal:2}}},
 {id:'wild-flowers',main:false,title:txt('Flowers on the windowsill','Bunga di jendela'),description:txt('A dozen daisies would brighten up the town hall. Bring 6.','Bunga daisy akan menghiasi balai desa. Bawakan 6 bunga.'),giver:'Elias',requirements:[{item:'flower',amount:6}],reward:{gold:220,items:{carrot_seed:6}}},
 {id:'animal-friend',main:false,title:txt('Small paws, big hearts','Kaki kecil, hati besar'),description:txt('Care for your animals 12 times. They notice every little kindness.','Rawat hewanmu 12 kali. Mereka mengingat setiap kebaikan.'),giver:'Mira',requirements:[{stat:'care',amount:12}],reward:{gold:450,items:{feed:15}}},
 {id:'kitchen-stories',main:false,title:txt('Stories from the kitchen','Kisah dari dapur'),description:txt('Make 5 recipes. Good food brings people together.','Buat 5 resep. Makanan enak menyatukan orang.'),giver:'Cleo',requirements:[{stat:'crafted',amount:5}],reward:{gold:550,items:{bouquet:1}}},
 {id:'big-little-farm',main:false,title:txt('Room to grow','Ruang untuk tumbuh'),description:txt('Expand your growing patch. There is room for a bigger dream.','Perluas lahan tanam. Masih ada ruang untuk mimpi yang besar.'),giver:'Rowan',requirements:[{upgrade:'expansion',amount:1}],reward:{gold:500,items:{cabbage_seed:8}}},
 {id:'moonlit-secret',main:false,title:txt('A moonlit secret','Rahasia cahaya bulan'),description:txt('Bring Finn a moonfish, found at the lake after 6 pm.','Bawa ikan bulan untuk Finn. Ikan ini ada di danau setelah jam 6 sore.'),giver:'Finn',requirements:[{item:'moonfish',amount:1}],reward:{gold:850,items:{ring:1}}},
];

export const RECIPES: Recipe[] = [
 {id:'soup',name:ITEMS.soup.name,ingredients:{turnip:2,carrot:1},output:'soup',quantity:1,description:txt('A bowl of home. Restores 40 energy.','Semangkuk kehangatan. Memulihkan 40 energi.')},
 {id:'omelet',name:ITEMS.omelet.name,ingredients:{egg:2},output:'omelet',quantity:1,description:txt('Simple, golden, lovely. Restores 32 energy.','Sederhana dan lezat. Memulihkan 32 energi.')},
 {id:'stew',name:ITEMS.stew.name,ingredients:{mushroom:2,potato:1},output:'stew',quantity:1,description:txt('Flavors of the forest. Restores 55 energy.','Cita rasa hutan. Memulihkan 55 energi.')},
 {id:'fish_dinner',name:ITEMS.fish_dinner.name,ingredients:{carp:1,carrot:1},output:'fish_dinner',quantity:1,description:txt('A slow evening by the lake. Restores 45 energy.','Malam tenang di danau. Memulihkan 45 energi.')},
 {id:'jam',name:ITEMS.jam.name,ingredients:{berry:4},output:'jam',quantity:1,description:txt('Summer, saved in a jar. Restores 24 energy.','Musim panas dalam toples. Memulihkan 24 energi.')},
 {id:'sprinkler',name:ITEMS.sprinkler.name,ingredients:{copper:5,iron:2,stone:5},output:'sprinkler',quantity:1,skill:'mining',level:2,description:txt('Place on your farm to water every planted tile each dawn.','Pasang di kebun untuk menyiram semua tanaman setiap pagi.')},
 {id:'scarecrow',name:ITEMS.scarecrow.name,ingredients:{wood:10,wool:1},output:'scarecrow',quantity:1,description:txt('A friendly guardian. Crops gain one bonus growth day when placed.','Penjaga kebun. Tanaman mendapat bonus satu hari pertumbuhan saat dipasang.')},
 {id:'bouquet',name:ITEMS.bouquet.name,ingredients:{flower:5},output:'bouquet',quantity:1,description:txt('Five flowers, one thoughtful gift.','Lima bunga, satu hadiah penuh makna.')},
 {id:'ring',name:ITEMS.ring.name,ingredients:{crystal:3,iron:5},output:'ring',quantity:1,skill:'mining',level:3,description:txt('A promise for a villager with eight hearts.','Janji untuk warga yang sudah memiliki delapan hati.')},
 {id:'feed',name:ITEMS.feed.name,ingredients:{corn:1},output:'feed',quantity:8,description:txt('Turn a little corn into a week of happy mornings.','Ubah jagung menjadi pakan untuk pagi yang bahagia.')},
];
export const FESTIVALS = [
 {season:0,day:14,name:txt('Blossom Picnic','Piknik Bunga'),description:txt('A spring picnic in the village square. Bring a flower.','Piknik musim semi di alun-alun. Bawa bunga.')},
 {season:1,day:14,name:txt('Lakefire Evening','Malam Api Danau'),description:txt('A summer celebration of fishing, food and friendship.','Perayaan musim panas bersama ikan, makanan dan persahabatan.')},
 {season:2,day:14,name:txt('Harvest Gathering','Perayaan Panen'),description:txt('Share a crop with the village and celebrate the season.','Berbagi hasil kebun dan merayakan musim.')},
 {season:3,day:14,name:txt('Starlight Night','Malam Bintang'),description:txt('Warm hearts and lanterns in the winter snow.','Hati hangat dan lentera di salju musim dingin.')},
];
export const ACHIEVEMENTS = [
 {id:'first-crop',name:txt('A green beginning','Awal yang hijau'),stat:'harvested',amount:1,icon:'plant'},
 {id:'farm-friend',name:txt('Everyone knows your name','Semua kenal namamu'),stat:'met',amount:6,icon:'users'},
 {id:'hundred-harvests',name:txt('Hands in the soil','Tangan di tanah'),stat:'harvested',amount:100,icon:'grains'},
 {id:'fish-friend',name:txt('Lake whisperer','Sahabat danau'),stat:'fish',amount:20,icon:'fish'},
 {id:'rich-roots',name:txt('Golden roots','Akar emas'),stat:'earned',amount:10000,icon:'coins'},
 {id:'caring-heart',name:txt('A caring heart','Hati yang peduli'),stat:'care',amount:30,icon:'heart'},
 {id:'restored',name:txt('The valley blooms again','Lembah kembali mekar'),stat:'restored',amount:1,icon:'sparkle'},
];
VILLAGERS.push(...EXTRA_VILLAGERS);
QUESTS.push(...EXTRA_QUESTS);
ACHIEVEMENTS.push({id:'farther-lights',name:txt('A wider world','Dunia yang lebih luas'),stat:'restored',amount:2,icon:'compass'});

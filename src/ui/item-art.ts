const garden=['turnip','potato','carrot','cabbage','radish','corn','pumpkin','cauliflower','berry','mushroom','flower','egg','wool','truffle','feed','fertilizer'];
const workshop=['wood','stone','copper','iron','crystal','sprinkler','bouquet','ring','soup','omelet','stew','fish_dinner','jam','brass_compass','glass_lens','ancient_chart'];
export function generatedItem(id:string) {
 const seed=id.endsWith('_seed'),key=seed?id.slice(0,-5):id;
 const sheet=garden.includes(key)?'garden':workshop.includes(key)?'workshop':null;
 if(!sheet)return '';const index=(sheet==='garden'?garden:workshop).indexOf(key);
 return `<span class="generated-item ${seed?'is-seed':''}" style="background-image:url('/assets/items/${sheet}.webp');background-position:${index%4/3*100}% ${Math.floor(index/4)/3*100}%"></span>${seed?'<i class="ph ph-grains seed-badge" aria-hidden="true"></i>':''}`;
}

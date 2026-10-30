import fs from 'node:fs';
import { ITEMS, CROPS, RECIPES, QUESTS, VILLAGERS } from '../src/game/content.ts';
import { AVATARS } from '../docs/unity/reference/places-draft.ts';
const directory = 'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Content';
fs.writeFileSync(`${directory}/simulation.json`,JSON.stringify({items:ITEMS,crops:CROPS,recipes:RECIPES,legacyQuests:QUESTS,villagers:VILLAGERS,appearances:AVATARS},null,2));
function clean(value) {
  if (typeof value==='string') {
    return value.replaceAll('â€™',"'").replaceAll('’',"'").replaceAll('â€“','–').replaceAll('â€”','—').replaceAll('â€œ','“').replaceAll('â€\u009d','”');
  }
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,clean(v)]));
  return value;
}
for (const file of fs.readdirSync(directory).filter(x=>x.endsWith('.json'))) {
  const value = clean(JSON.parse(fs.readFileSync(`${directory}/${file}`,'utf8')));
  fs.writeFileSync(`${directory}/${file}`,JSON.stringify(value,null,2));
}
console.log(JSON.stringify({items:Object.keys(ITEMS).length,crops:Object.keys(CROPS).length,recipes:RECIPES.length,appearances:AVATARS.length}));

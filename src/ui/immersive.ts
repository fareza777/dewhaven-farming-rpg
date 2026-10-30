import { CROPS } from '../game/content.ts';
import type { Tool } from '../game/types.ts';
import { icon, t } from './i18n.ts';
import { button, toolActionLabel } from './views.ts';
import { coinArt, toolArt } from './art.ts';
export { coinArt, toolArt } from './art.ts';
import type { ViewContext } from './views.ts';

export function game(ctx:ViewContext) {
  const s=ctx.s,en=ctx.lang==='en';
  const quick=(['hand','hoe','water','seed'] as Tool[]).map(tool=>button(toolArt(tool),'tool',`quick-tool ${s.selectedTool===tool?'selected':''}`,`data-tool="${tool}" data-quick="true" aria-label="${t(tool,ctx.lang)}" aria-pressed="${s.selectedTool===tool}"`)).join('');
  return `<main class="immersive-game" aria-label="${en?'Your valley':'Lembahmu'}"><canvas id="world" tabindex="0" aria-label="Dewhaven game world"></canvas><div class="hud-shade"></div><div class="compact-hud"><div class="day-hud">${button(`<span id="hud-weather"></span><span id="hud-day"></span>`,'calendar','date-button',`aria-label="${t('calendar',ctx.lang)}"`)}<div class="time-energy"><span id="hud-clock"></span><span class="energy-line">${icon('lightning')}<span class="energy-track"><span id="energy-bar"></span></span><span id="hud-energy"></span></span></div></div><div class="money-hud" aria-label="Gold">${coinArt()}<strong id="hud-gold"></strong><span id="gold-change" aria-live="polite"></span></div></div><nav class="world-menu" aria-label="Game navigation">${button(icon('list'),'actions','floating-button menu-button','aria-label="More menu"')}${button(`${icon('book-open')}<span id="quest-dot"></span>`,'journal','floating-button quest-button',`aria-label="${t('journal',ctx.lang)}"`)}${button(icon('pause'),'pause','floating-button world-pause',`aria-label="${en?'Pause':'Jeda'}"`)}</nav><div class="mobile-controls"><div id="movement-joystick" class="joystick" role="button" tabindex="0" aria-label="Movement joystick"><span class="joystick-ring"></span><span class="joystick-handle">${icon('arrows-out-cardinal')}</span></div>${button(`${toolArt(s.selectedTool)}<span>${toolActionLabel(s.selectedTool,ctx.lang)}</span>`,'interact','touch-interact',`aria-label="${toolActionLabel(s.selectedTool,ctx.lang)} nearby"`)}</div><nav class="quick-tools" role="toolbar" aria-label="Farming tools">${quick}${button(`${toolArt(['axe','pickaxe','rod'].includes(s.selectedTool)?s.selectedTool:'axe')}<span class="tool-more">${icon('dots-three')}</span>`,'tools',`quick-tool tool-library ${['axe','pickaxe','rod'].includes(s.selectedTool)?'selected':''}`,'aria-label="Choose tool"')}${button(icon('backpack'),'backpack','quick-tool bag-shortcut',`aria-label="${t('backpack',ctx.lang)}"`)}</nav><span class="selected-tool-note" id="tool-note"></span><div class="coin-flight-layer" aria-hidden="true"></div></main>`;
}

export function title(ctx:ViewContext,hasSave:boolean) {
  return `<main class="opening-title"><img class="opening-art" src="/assets/cinematic/homestead.webp" alt="A quiet homestead at sunrise"><div class="opening-shade"></div><div class="opening-top"><img src="/assets/brand/icon.svg" alt="" width="36" height="36">${button(icon('gear-six'),'settings','opening-icon',`aria-label="${t('settings',ctx.lang)}"`)}</div><div class="opening-name"><span class="opening-kicker">THE LANTERN PROMISE</span><h1>Dewhaven</h1><p>${t('tagline',ctx.lang)}</p></div><div class="opening-bottom"><div class="opening-buttons">${button(`${ctx.lang==='en'?'Begin your story':'Mulai kisahmu'} ${icon('arrow-right')}`,'new-game','button opening-primary',`aria-label="${t('newGame',ctx.lang)}"`)}${button(t('continue',ctx.lang),'continue','button opening-secondary',hasSave?'':'disabled')}</div><footer class="opening-footer">${button(t('about',ctx.lang),'about','text-button')}${button(t('share',ctx.lang),'share','text-button')}${button(t('rate',ctx.lang),'rate','text-button')}</footer><span class="opening-nature">${icon('wind')} ${ctx.lang==='en'?'Only nature. Only your pace.':'Suara alam. Iramamu sendiri.'}</span></div></main>`;
}

export function nextTask(ctx:ViewContext) {
  const s=ctx.s,en=ctx.lang==='en';
  if(s.stats.planted<3)return en?'Plant three seeds. A small promise, kept.':'Tanam tiga benih. Awal untuk sebuah janji.';
  const ripe=s.plots.filter(p=>p.crop&&p.growth>=CROPS[p.crop].days).length;
  if(ripe)return en?`${ripe} ripe crops are waiting in the garden.`:`${ripe} tanaman siap dipanen.`;
  if(s.plots.some(p=>p.crop&&!p.watered))return en?'Give the garden its morning water.':'Siram kebun di pagi hari.';
  if(s.animals.some(a=>!a.fed))return en?'A little breakfast for your animals.':'Siapkan pakan untuk ternakmu.';
  return en?'Meet a neighbor. The valley is opening up.':'Sapa tetanggamu. Jelajahi lembah.';
}

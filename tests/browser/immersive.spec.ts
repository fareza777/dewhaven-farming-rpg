import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../../src/game/simulation.ts';
import { encodeSave } from '../../src/game/save.ts';
import type { GameState } from '../../src/game/types.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test.setTimeout(60000);
const errors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
const state=(page:Page)=>page.evaluate(()=>(window as any).__dewhaven.state as GameState);
const idle=(page:Page)=>expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.toolAnimation?.tool||null)).toBe(null);

async function load(page:Page,s=createGame('Robin','Amber')) {
  s.tutorialDone=true;await page.addInitScript(data=>{if(!localStorage.getItem('dewhaven.save.0'))localStorage.setItem('dewhaven.save.0',data);},encodeSave(s));
  await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).tap();
  await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
}
async function menu(page:Page,action:string) {
  await page.getByRole('button',{name:'More menu',exact:true}).tap();
  await page.locator(`#modal [data-action="${action}"]`).tap();
}
async function patch(page:Page,index:number) {
  const point=await page.evaluate(i=>{const app=(window as any).__dewhaven,p=app.state.plots[i],r=app.world.renderer,b=r.canvas.getBoundingClientRect();return{x:b.x+((p.x+.5)*16-r.camera.x)*r.scale,y:b.y+((p.y+.5)*16-r.camera.y)*r.scale};},index);
  await page.touchscreen.tap(point.x,point.y);
}

test('four paintings, two short guides, and first light lead into the same saved story',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'New game',exact:true}).tap();
  await page.locator('[name="farmName"]').fill('Amber');await page.getByRole('button',{name:'Start game',exact:false}).tap();
  const names=['A key. A promise.','The road to Dewhaven.','Something worth growing.','Your first morning.','Make yourself at home.','A day, well spent.'];
  for(let i=0;i<6;i++) {
    await expect(page.locator('.cinematic-copy h2')).toHaveText(names[i]);
    await expect.poll(()=>page.locator('.cinematic-art').evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>0)).toBe(true);
    for(const [width,height] of [[320,667],[390,844],[412,915]]) {
      await page.setViewportSize({width,height});
      const fit=await page.locator('.cinematic-copy').evaluate(el=>{const r=el.getBoundingClientRect(),header=document.querySelector('.cinematic-top')!.getBoundingClientRect();return{top:r.top,bottom:r.bottom,header:header.bottom,height:innerHeight,scroll:document.querySelector('.modal-wrap')!.scrollHeight-document.querySelector('.modal-wrap')!.clientHeight};});
      expect(fit.top).toBeGreaterThan(fit.header+8);expect(fit.bottom).toBeLessThanOrEqual(fit.height);expect(fit.scroll).toBe(0);
    }
    if(i===1){await page.getByRole('button',{name:'Previous scene',exact:true}).tap();await expect(page.locator('.cinematic-copy h2')).toHaveText(names[0]);await page.locator('[data-action="next-tour"]').tap();}
    if(i<4)await page.screenshot({path:`docs/screenshots/story-${i+1}.png`});
    await page.locator(`[data-action="${i===5?'finish-tour':'next-tour'}"]`).tap();
  }
  await expect(page.getByRole('heading',{name:'First light.',exact:true})).toBeVisible();
  expect((await state(page)).time).toBe(360);expect((await state(page)).tutorialDone).toBe(true);
  await page.getByRole('button',{name:'Step outside',exact:false}).tap();
  await expect(page.locator('#modal')).not.toBeVisible();
  expect((await state(page)).player).toMatchObject({x:17.5,y:14.5,area:'farm'});
  await page.getByRole('button',{name:'Pause',exact:true}).tap();
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
  await expect(page.locator('#modal')).not.toBeVisible();expect((await state(page)).farmName).toBe('Amber');
});

test('skipping and replaying the opening preserve an existing farm',async({page})=>{
  const s=createGame('Robin','Amber');s.day=8;s.totalDays=8;s.gold=1850;s.completed=['new-roots'];
  await load(page,s);await menu(page,'settings');await page.locator('#modal [data-action="about"]').tap();
  await page.getByRole('button',{name:'Replay opening',exact:true}).tap();await page.getByRole('button',{name:'Skip the tour',exact:true}).tap();
  await expect(page.locator('#modal')).not.toBeVisible();
  const after=await state(page);expect(after.day).toBe(8);expect(after.gold).toBe(1850);expect(after.completed).toEqual(['new-roots']);
});

test('quick planting needs one tap and physical changes wait for contact',async({page})=>{
  const s=createGame('Robin','Amber');s.player.x=23.5;s.player.y=18.7;
  await load(page,s);
  // Observe a real pointer event after its handler, before the first animation frame.
  await page.evaluate(()=>{document.addEventListener('pointerdown',event=>{if((event.target as Element).id!=='world')return;queueMicrotask(()=>{const app=(window as any).__dewhaven;(window as any).__contactSnapshot={plot:structuredClone(app.state.plots[20]),energy:app.state.energy,animation:app.world.renderer.toolAnimation?.elapsed};});});});
  await page.locator('.quick-tools [data-tool="hoe"]').tap();await patch(page,20);
  const first=await page.evaluate(()=>(window as any).__contactSnapshot);expect(first.animation).toBe(0);expect(first.plot.tilled).toBe(false);expect(first.energy).toBe(100);
  await expect.poll(async()=>(await state(page)).plots[20].tilled).toBe(true);await idle(page);
  await page.locator('.quick-tools [data-tool="seed"]').tap();await expect(page.locator('#modal')).not.toBeVisible();
  await patch(page,20);const seed=await page.evaluate(()=>(window as any).__contactSnapshot);expect(seed.plot.crop).toBe(null);
  await expect.poll(async()=>(await state(page)).plots[20].crop).toBe('turnip');await idle(page);
  await page.locator('.quick-tools [data-tool="water"]').tap();await patch(page,20);
  const water=await page.evaluate(()=>(window as any).__contactSnapshot);expect(water.plot.watered).toBe(false);
  await expect.poll(async()=>(await state(page)).plots[20].watered).toBe(true);
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.ripples.length)).toBeGreaterThan(0);
  await idle(page);expect(await page.evaluate(()=>(window as any).__dewhaven.world.renderer.ripples.length)).toBeGreaterThan(0);
  expect(await page.locator('.toast').count()).toBe(0);
  await page.locator('.quick-tools [data-tool="seed"]').tap();await page.locator('.quick-tools [data-tool="seed"]').tap();
  await expect(page.locator('[data-action="choose-seed"]')).not.toHaveCount(0);
  await page.locator('[data-action="choose-seed"][data-seed="carrot"]').tap();expect((await state(page)).selectedSeed).toBe('carrot');
});

test('overnight growth, shipment earnings and coins belong to one new day',async({page})=>{
  const s=createGame('Robin','Amber');s.shipping={turnip:2};s.plots[8].watered=true;s.player.x=23.5;s.player.y=20.6;
  await load(page,s);await menu(page,'home');await page.locator('[data-action="sleep"]').tap();
  await expect(page.locator('.dawn-earnings')).toContainText('+130 G');expect((await state(page)).gold).toBe(630);expect((await state(page)).day).toBe(2);expect((await state(page)).plots[8].growth).toBe(s.plots[8].growth+1);
  await page.getByRole('button',{name:'Step outside',exact:false}).tap();await expect(page.locator('.money-hud')).toHaveClass(/earning/);await expect(page.locator('.flying-coin')).toHaveCount(6);
  await expect(page.locator('#hud-gold')).toHaveText('630');
  await page.screenshot({path:'docs/screenshots/immersive-gameplay.png'});
  for(const [width,height] of [[320,667],[390,844],[412,915]]) {
    await page.setViewportSize({width,height});
    const layout=await page.evaluate(()=>{const canvas=document.querySelector('#world')!.getBoundingClientRect(),controls=[...document.querySelectorAll<HTMLElement>('.quick-tool,.floating-button,.touch-interact,.joystick,.date-button')];const overlap:string[]=[];for(let a=0;a<controls.length;a++)for(let b=a+1;b<controls.length;b++){const x=controls[a].getBoundingClientRect(),y=controls[b].getBoundingClientRect();if(Math.min(x.right,y.right)>Math.max(x.left,y.left)&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top))overlap.push(controls[a].className+' / '+controls[b].className);}return{height:canvas.height,width:canvas.width,scroll:document.body.scrollHeight-innerHeight,small:controls.filter(el=>{const r=el.getBoundingClientRect();return r.width<44||r.height<44}).length,overlap};});
    expect(layout).toMatchObject({height,width,scroll:0,small:0,overlap:[]});
  }
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
  expect((await state(page)).gold).toBe(630);expect((await state(page)).shipping).toEqual({});
});

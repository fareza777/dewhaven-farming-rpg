import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../../src/game/simulation.ts';
import { encodeSave } from '../../src/game/save.ts';
import { DUNGEONS } from '../../src/game/expansion-content.ts';
import type { GameState } from '../../src/game/types.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test.setTimeout(60000);
const errors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const list:string[]=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
const state=(page:Page)=>page.evaluate(()=>(window as any).__dewhaven.state as GameState);
async function load(page:Page,s=createGame('Robin','Amber')){
 s.tutorialDone=true;
 await page.addInitScript(data=>{if(!localStorage.getItem('dewhaven.save.0'))localStorage.setItem('dewhaven.save.0',data);},encodeSave(s));
 await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
}
async function menu(page:Page,action:string){await page.getByRole('button',{name:'More menu',exact:true}).tap();await page.locator(`#modal [data-action="${action}"]`).tap();}
async function worldTap(page:Page,x:number,y:number){
 const point=await page.evaluate(({x,y})=>{const r=(window as any).__dewhaven.world.renderer,b=r.canvas.getBoundingClientRect();return{x:b.x+(x*16-r.camera.x)*r.scale,y:b.y+(y*16-r.camera.y)*r.scale};},{x,y});
 expect(point.x).toBeGreaterThan(0);expect(point.x).toBeLessThan(390);expect(point.y).toBeGreaterThan(100);expect(point.y).toBeLessThan(650);
 await page.touchscreen.tap(point.x,point.y);
}

test('walk through a farmhouse door, use the bed and return to the same doorstep',async({page})=>{
 await load(page);
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:80,y:500}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:80,y:460}]});
 await expect.poll(async()=>(await state(page)).player.area).toBe('farmhouse');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.locator('#modal')).not.toBeVisible();
 const roomBottom=await page.locator('#world').evaluate((canvas:HTMLCanvasElement)=>Array.from(canvas.getContext('2d')!.getImageData(Math.floor(canvas.width/2),canvas.height-2,1,1).data));
 expect(roomBottom[3]).toBe(255);expect(roomBottom[2]).toBeGreaterThanOrEqual(roomBottom[1]);
 await worldTap(page,17.5,11.5);
 await expect(page.getByRole('heading',{name:'Home, at last.',exact:true})).toBeVisible({timeout:12000});
 await page.getByRole('button',{name:'Close',exact:true}).tap();
 // The actual exit sits at the foot of the hall, reached through touch pathfinding.
 await page.keyboard.down('ArrowDown');await expect.poll(async()=>(await state(page)).player.y,{timeout:8000}).toBeGreaterThan(18);
 await page.keyboard.up('ArrowDown');
 await worldTap(page,12.5,19);
 await expect.poll(async()=>(await state(page)).player.x,{timeout:10000}).toBeLessThan(12.8);
 await page.keyboard.down('ArrowDown');
 await expect.poll(async()=>(await state(page)).player.area,{timeout:10000}).toBe('farm');
 await page.keyboard.up('ArrowDown');
 const p=(await state(page)).player;expect(p.x).toBeCloseTo(17.5,1);expect(p.y).toBeCloseTo(14.5,1);
});

test('all three vaults respond to touch mechanisms and persist a single recovered treasure',async({page})=>{
 await load(page);
 for(const d of DUNGEONS){
  for(const [i,[x,y]]of [[7,10],[24,11],[16,18]].entries()){
   await page.evaluate(({area,x,y})=>{const app=(window as any).__dewhaven;app.world.travel(area,[x+.5,y+2.2]);app.world.renderer.center();},{area:d.id,x,y});
   await page.waitForTimeout(700);await worldTap(page,x+.5,y+1.5);
   await expect.poll(async()=>(await state(page)).discoveries.includes(`${d.id}-switch-${i}`)).toBe(true);
  }
  await page.evaluate(area=>{const app=(window as any).__dewhaven;app.world.travel(area,[16.5,10.2]);app.world.renderer.center();},d.id);
  await page.waitForTimeout(700);await worldTap(page,16.5,9.5);
  await expect(page.locator('.discovery-scene')).toBeVisible();expect((await state(page)).inventory[d.item]).toBe(1);
  const gold=(await state(page)).gold;
  await page.getByRole('button',{name:'Keep exploring',exact:false}).tap();await worldTap(page,16.5,9.5);
  expect((await state(page)).gold).toBe(gold);expect((await state(page)).inventory[d.item]).toBe(1);
 }
 await page.getByRole('button',{name:'Backpack',exact:true}).tap();
 await page.locator('[data-action="bag-tab"][data-tab="materials"]').tap();
 await page.locator('[data-action="select-item"][data-item="ancient_chart"]').tap();
 await expect(page.locator('[data-action="use-item"][data-item="ancient_chart"]')).toBeDisabled();
 await expect(page.locator('[data-action="ship-item"][data-item="ancient_chart"]')).toBeDisabled();
 await expect(page.locator('.item-details')).toContainText('Recovered for the atlas.');
 await page.getByRole('button',{name:'Close',exact:true}).tap();
 await page.getByRole('button',{name:'Pause',exact:true}).tap();
 await page.getByRole('button',{name:'Save game',exact:true}).tap();await page.reload();
 await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
 for(const d of DUNGEONS)expect((await state(page)).discoveries).toContain(`${d.id}-chest`);
});

test('calendar gatherings, relationship choices and chapter reading work without losing the farm',async({page})=>{
 const s=createGame('Robin','Amber');s.day=2;s.totalDays=2;s.inventory.trout=1;s.friendships.mira.points=250;s.completed=['new-roots'];
 await load(page,s);await menu(page,'calendar');await page.getByRole('button',{name:'Town gatherings',exact:true}).tap();
 await page.locator('[data-action="visit-gathering"][data-event="quay-fair"]').tap();
 await page.getByRole('button',{name:'Join the gathering',exact:true}).tap();
 expect((await state(page)).stats.communityEvents).toBe(1);expect((await state(page)).inventory.trout).toBeUndefined();
 await expect(page.getByRole('button',{name:'Join the gathering',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Close',exact:true}).tap();
 await menu(page,'people');await page.locator('[data-action="person"][data-person="mira"]').tap();
 await page.locator('[data-action="visit-person"]').tap();
 await expect(page.locator('[data-action="bond"]')).toBeVisible({timeout:18000});
 await page.locator('[data-action="bond"]').tap();await page.locator('[data-action="bond-choice"][data-choice="0"]').tap();
 expect((await state(page)).discoveries).toContain('bond-mira-0');
 await page.getByRole('button',{name:'Close',exact:true}).tap();await page.getByRole('button',{name:'Journal',exact:true}).tap();
 await page.locator('[data-action="read-chapter"][data-quest="new-roots"]').tap();
 await expect(page.locator('.chapter-scene')).toBeVisible();await page.locator('[data-action="chapter-next"]').tap();
 await page.getByRole('button',{name:'Back to the valley',exact:false}).tap();
 expect((await state(page)).farmName).toBe('Amber');expect((await state(page)).stats.communityEvents).toBe(1);
});

test('holding a tool tends nearby soil, releasing stops, and generated item art loads',async({page})=>{
 const s=createGame('Robin','Amber');s.player.x=23.5;s.player.y=18.7;
 await load(page,s);await page.locator('.quick-tools [data-tool="hoe"]').tap();
 const cdp=await page.context().newCDPSession(page),box=(await page.locator('.touch-interact').boundingBox())!;
 const before=(await state(page)).plots.filter(p=>p.tilled).length;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:box.x+box.width/2,y:box.y+box.height/2}]});
 await expect.poll(async()=>(await state(page)).plots.filter(p=>p.tilled).length,{timeout:5000}).toBeGreaterThan(before+1);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(1000);
 const stopped=(await state(page)).plots.filter(p=>p.tilled).length;await page.waitForTimeout(800);
 expect((await state(page)).plots.filter(p=>p.tilled).length).toBe(stopped);
 await page.getByRole('button',{name:'Backpack',exact:true}).tap();
 const art=page.locator('.generated-item').first();await expect(art).toBeVisible();
 const loaded=await art.evaluate(async el=>{const url=getComputedStyle(el).backgroundImage.match(/url\(["']?(.*?)["']?\)/)![1],image=new Image();image.src=url;await image.decode();return image.naturalWidth;});expect(loaded).toBe(1254);
 await page.screenshot({path:'docs/screenshots/generated-inventory.png'});
});

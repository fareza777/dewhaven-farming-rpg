import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../../src/game/simulation.ts';
import { encodeSave } from '../../src/game/save.ts';
import { MAPS } from '../../src/world/maps.ts';
import type { GameState, Tool } from '../../src/game/types.ts';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
test.setTimeout(45000);
const errors = new WeakMap<Page, string[]>();
test.beforeEach(({page}) => { const list:string[]=[]; errors.set(page,list); page.on('pageerror',error=>list.push(error.message)); });
test.afterEach(({page}) => expect(errors.get(page)).toEqual([]));
const read = (page:Page) => page.evaluate(()=>(window as any).__dewhaven.state as GameState);
const idle = (page:Page) => expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.toolAnimation?.tool||null)).toBe(null);

async function load(page:Page,state=createGame('Robin','Amber')) {
  state.tutorialDone=true;
  if(state.player.x===17.5&&state.player.y===14.5){state.player.x=23.5;state.player.y=20.6;}
  await page.addInitScript(data=>localStorage.setItem('dewhaven.save.0',data),encodeSave(state));
  await page.goto('/');
  await page.getByRole('button',{name:'Continue',exact:true}).tap();
  await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
  await expect(page.locator('#movement-joystick')).toBeVisible();
}
async function tool(page:Page,name:string) {
  await idle(page);
  await page.getByRole('button',{name:'Choose tool',exact:true}).tap();
  await page.locator('#modal').getByRole('button',{name,exact:true}).tap();
  if(name==='Plant')await page.locator('[data-action="choose-seed"][data-seed="turnip"]').tap();
}
async function tapWorld(page:Page,x:number,y:number) {
  const point=await page.evaluate(({x,y})=>{
    const r=(window as any).__dewhaven.world.renderer,rect=r.canvas.getBoundingClientRect();
    return {x:rect.x+(x*16-r.camera.x)*r.scale,y:rect.y+(y*16-r.camera.y)*r.scale};
  },{x,y});
  await page.touchscreen.tap(point.x,point.y);
}

test('a tool button remains tappable while the clock refreshes',async({page})=>{
  await load(page);
  const button=page.getByRole('button',{name:'Choose tool',exact:true});
  const box=(await button.boundingBox())!,cdp=await page.context().newCDPSession(page);
  const point={id:1,x:box.x+box.width/2,y:box.y+box.height/2};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await page.waitForTimeout(900);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect(page.locator('.tool-choice')).toHaveCount(7);
});

test('resuming after Android background restores nature audio',async({page})=>{
  await load(page);
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.audio.ctx.state)).toBe('running');
  await page.evaluate(()=>(window as any).__dewhaven.background());
  await expect(page.getByRole('heading',{name:'Paused',exact:true})).toBeVisible();
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.audio.ctx.state)).toBe('suspended');
  await page.locator('#modal').getByRole('button',{name:'Resume',exact:true}).tap();
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.audio.ctx.state)).toBe('running');
});

test('portrait menus and a real two-finger joystick gesture work under the thumbs',async({page})=>{
  await load(page);
  await expect(page.locator('.quick-tools .quick-tool')).toHaveCount(6);
  await expect(page.locator('#world')).toHaveCSS('height','844px');
  await expect(page.locator('.welcome-row,.mobile-dock,.world-location')).toHaveCount(0);
  await expect(page.locator('.main-nav')).toBeHidden();
  await expect(page.locator('.toolbelt-wrapper')).toBeHidden();
  expect(await page.evaluate(()=>document.body.scrollHeight<=innerHeight&&document.body.scrollWidth<=innerWidth)).toBe(true);
  for(const [width,height] of [[320,667],[412,915],[390,844]]){
    await page.setViewportSize({width,height});
    const overlaps=await page.locator('.joystick,.touch-interact,.world-pause').evaluateAll(els=>{
    const hits:string[]=[];
    for(let a=0;a<els.length;a++)for(let b=a+1;b<els.length;b++){
      const x=els[a].getBoundingClientRect(),y=els[b].getBoundingClientRect();
      if(Math.min(x.right,y.right)>Math.max(x.left,y.left)&&Math.min(x.bottom,y.bottom)>Math.max(x.top,y.top))hits.push(`${els[a].className} / ${els[b].className}`);
    }
    return hits;
    });
    expect(overlaps,`controls at ${width}×${height}`).toEqual([]);
  }
  await page.getByRole('button',{name:'Choose tool',exact:true}).tap();
  await expect(page.locator('.tool-choice')).toHaveCount(7);
  const small=await page.locator('.tool-choice').evaluateAll(els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.width<44||r.height<44;}).length);
  expect(small).toBe(0);
  await page.locator('#modal').getByRole('button',{name:'Hoe',exact:true}).tap();
  await expect(page.getByRole('button',{name:'Hoe nearby',exact:true})).toBeVisible();
  const stick=(await page.locator('#movement-joystick').boundingBox())!,action=(await page.locator('.touch-interact').boundingBox())!;
  const cdp=await page.context().newCDPSession(page);
  const origin={id:1,x:stick.x+stick.width/2,y:stick.y+stick.height/2};
  const left={...origin,x:origin.x+28};
  const right={id:2,x:action.x+action.width/2,y:action.y+action.height/2};
  const before=(await read(page)).player.x;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[origin]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[left]});
  await page.waitForTimeout(200);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left,right]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[right]});
  expect(await page.evaluate(()=>(window as any).__dewhaven.world.touch.x)).toBeGreaterThan(0);
  await page.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(async()=>(await read(page)).player.x).toBeGreaterThan(before);
  await page.waitForTimeout(200);
  const after=(await read(page)).player.x;
  await page.waitForTimeout(250);
  expect((await read(page)).player.x).toBeCloseTo(after,2);
  await page.getByRole('button',{name:'More menu',exact:true}).tap();
  await expect(page.locator('.menu-tile')).toHaveCount(12);
  await page.locator('#modal').getByRole('button',{name:'Townsfolk',exact:true}).tap();
  await expect(page.locator('.person-card')).toHaveCount(4);
  await page.getByRole('button',{name:'Close',exact:true}).tap();
  await page.getByRole('button',{name:'More menu',exact:true}).tap();
  await page.locator('#modal').getByRole('button',{name:'Settings',exact:true}).tap();
  await page.getByRole('button',{name:'Response →',exact:true}).tap();
  await page.locator('#haptics-toggle').uncheck();
  await page.getByRole('button',{name:'Close',exact:true}).tap();
  await page.getByRole('button',{name:'More menu',exact:true}).tap();
  await page.locator('#modal').getByRole('button',{name:'Field guide',exact:true}).tap();
  await expect(page.locator('.help-grid')).toContainText('left joystick');
  await expect(page.locator('.help-grid')).not.toContainText('W A S D');
});

test('hoe, plant, water, and harvest have visible effects and prevent stacked actions',async({page})=>{
  const state=createGame('Robin','Amber'); state.player.x=22.5;state.player.y=20.8;
  await load(page,state);
  const plot=state.plots[20];
  await tool(page,'Hoe');
  await tapWorld(page,plot.x+.5,plot.y+.5);
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.toolAnimation?.tool)).toBe('hoe');
  await expect.poll(async()=>(await read(page)).plots[20].tilled).toBe(true);
  const energy=(await read(page)).energy;
  await tapWorld(page,plot.x+.5,plot.y+.5);
  expect((await read(page)).energy).toBe(energy);
  await tool(page,'Plant');
  await tapWorld(page,plot.x+.5,plot.y+.5);
  await expect.poll(async()=>(await read(page)).plots[20].crop).toBe('turnip');
  expect((await read(page)).stats.planted).toBe(1);
  await tool(page,'Water');
  await tapWorld(page,plot.x+.5,plot.y+.5);
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.toolAnimation?.tool)).toBe('water');
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.debris.length)).toBeGreaterThan(0);
  const before=(await read(page)).player;
  await page.keyboard.down('d');
  await page.waitForTimeout(200);
  expect((await read(page)).player.x).toBe(before.x);
  await page.keyboard.up('d');
  await page.screenshot({path:'docs/screenshots/watering-portrait.png'});
  await idle(page);
  expect((await read(page)).plots[20].watered).toBe(true);
  await tool(page,'Gather');
  const ripe=state.plots[0];
  await tapWorld(page,ripe.x+.5,ripe.y+.5);
  await expect.poll(async()=>(await read(page)).stats.harvested).toBe(1);
  expect((await read(page)).inventory.turnip).toBe(1);
});

for(const [resource,selected,label,item] of [['wood','axe','Axe','wood'],['stone','pickaxe','Pickaxe','stone'],['flower','hand','Gather','flower']] as const) {
  test(`${label} gathers ${resource} with its own physical animation`,async({page})=>{
    const object=MAPS.farm.objects.find(o=>o.resource===resource)!,s=createGame('Robin','Amber');
    s.player.x=object.x+.5;s.player.y=object.y+2.5;
    await load(page,s);
    if(selected!=='hand') {
      await tapWorld(page,object.x+.5,object.y+1.5);
      await expect(page.locator('.toast.error').last()).toBeVisible();
      expect((await read(page)).removed[object.id]).toBeUndefined();
    }
    await tool(page,label);
    await tapWorld(page,object.x+.5,object.y+1.5);
    await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.toolAnimation?.tool)).toBe(selected as Tool);
    await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.debris.length)).toBeGreaterThan(0);
    expect((await read(page)).inventory[item]).toBeGreaterThan(s.inventory[item]||0);
    expect((await read(page)).removed[object.id]).toBe(s.totalDays);
    await idle(page);
  });
}

test('the fishing rod casts from a portrait action button',async({page})=>{
  const s=createGame('Robin','Amber');s.player={area:'lake',x:27.5,y:21.5,direction:'right'};
  await load(page,s);
  await tool(page,'Fishing rod');
  await page.getByRole('button',{name:'Fish nearby',exact:true}).tap();
  await page.locator('[data-action="cast"]').tap();
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.toolAnimation?.tool)).toBe('rod');
  await expect(page.locator('.fishing-scene .lake-art')).toBeVisible();
  await expect(page.locator('#fish-marker')).toBeVisible({timeout:6000});
  await expect(page.locator('[data-action="reel"]')).toBeVisible();
  const box=(await page.locator('[data-action="reel"]').boundingBox())!,cdp=await page.context().newCDPSession(page);
  const point={id:1,x:box.x+box.width/2,y:box.y+box.height/2};
  for(let reel=0;reel<3;reel++) {
    await page.waitForFunction(()=>{const x=parseFloat(document.querySelector<HTMLElement>('#fish-marker')!.style.left);return x>=39&&x<=57;},undefined,{polling:'raf',timeout:5000});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
    if(reel===0){await expect(page.locator('.fishing-progress span.success')).toHaveCount(1);await page.waitForTimeout(350);}
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    if(reel===0)await expect(page.locator('.fishing-progress span.success')).toHaveCount(1);
    if(reel<2)await page.waitForTimeout(300);
  }
  await expect.poll(async()=>(await read(page)).stats.fish).toBe(1);
  await expect(page.locator('#modal')).not.toBeVisible();
});

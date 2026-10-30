import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../../src/game/simulation.ts';
import { encodeSave } from '../../src/game/save.ts';
const runtimeErrors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const errors:string[]=[];runtimeErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(({page})=>{expect(runtimeErrors.get(page)||[],'browser runtime errors').toEqual([]);});

async function start(page:Page) {
  await page.goto('/');
  await page.getByRole('button',{name:'New game',exact:true}).click();
  await page.locator('[name="playerName"]').fill('Robin');
  await page.locator('[name="farmName"]').fill('Amber');
  await page.getByRole('button',{name:'Start game',exact:false}).click();
  await page.getByRole('button',{name:'Skip the tour'}).click();
  await page.getByRole('button',{name:'Step outside',exact:false}).click();
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(1700);await page.keyboard.up('ArrowDown');
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(1600);await page.keyboard.up('ArrowRight');await page.waitForTimeout(200);
  await expect(page.locator('#world')).toBeVisible();
}
async function patch(page:Page,id:string) {
  await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.world.renderer.toolAnimation)).toBe(null);
  let point:{x:number;y:number;left:number;right:number;top:number;bottom:number};
  for(let attempt=0;attempt<4;attempt++) {
    point=await page.evaluate(id=>{const app=(window as any).__dewhaven,p=app.state.plots.find((p:any)=>p.id===id),r=app.world.renderer,rect=r.canvas.getBoundingClientRect();return {x:rect.x+((p.x+.5)*16-r.camera.x)*r.scale,y:rect.y+((p.y+.5)*16-r.camera.y)*r.scale,left:rect.left,right:rect.right,top:rect.top,bottom:rect.bottom};},id);
    if(point.x>point.left+24&&point.x<point.right-24&&point.y>point.top+120&&point.y<point.bottom-160)break;
    const direction=point.x<=point.left+24?'ArrowLeft':point.x>=point.right-24?'ArrowRight':point.y<=point.top+120?'ArrowUp':'ArrowDown';
    await page.keyboard.down(direction);await page.waitForTimeout(650);await page.keyboard.up(direction);await page.waitForTimeout(180);
  }
  await page.mouse.click(point!.x,point!.y);
}
async function read(page:Page) {return page.evaluate(()=>(window as any).__dewhaven.state);}
async function close(page:Page) {
  const day=page.locator('[data-action="begin-day"]');
  if(await day.isVisible())await day.click();else await page.getByRole('button',{name:'Close',exact:true}).click();
}
async function openMenu(page:Page,action:string) {
  await expect(page.locator("#screen")).toBeVisible();
  if(await page.locator('#modal').isVisible())await close(page);
  const direct=page.locator(`#screen [data-action="${action}"]`);
  if(await direct.count()&&await direct.first().isVisible()){await direct.first().click();return;}
  await page.getByRole('button',{name:'More menu',exact:true}).click();
  await page.locator(`#modal [data-action="${action}"]`).click();
}
async function save(page:Page) {await openMenu(page,'pause');await page.locator('#modal [data-action="save"]').click();} 


test('new story, actual field controls, first quest, shipment, sleep, and reload',async({page})=>{
  test.setTimeout(60000);
  await start(page);
  for(const id of ['plot-20','plot-21','plot-22']) {
    await page.locator('[data-action="tool"][data-tool="hoe"]').click();
    await patch(page,id);
    await expect.poll(async()=>(await read(page)).plots.find((p:any)=>p.id===id).tilled).toBe(true);
    await page.locator('[data-action="tool"][data-tool="seed"]').click();
    if(await page.locator('#modal').isVisible())await page.locator('[data-action="choose-seed"][data-seed="turnip"]').click();
    await patch(page,id);
    await expect.poll(async()=>(await read(page)).plots.find((p:any)=>p.id===id).crop).toBe('turnip');
    await page.locator('[data-action="tool"][data-tool="water"]').click();
    await patch(page,id);
    await expect.poll(async()=>(await read(page)).plots.find((p:any)=>p.id===id).watered).toBe(true);
  }
  await openMenu(page,'journal');
  await expect(page.locator('[data-action="claim"][data-quest="new-roots"]')).toBeEnabled();
  await page.locator('[data-action="claim"][data-quest="new-roots"]').click();
  expect((await read(page)).gold).toBe(650);
  await close(page);
  await page.locator('[data-action="tool"][data-tool="hand"]').click();
  await patch(page,'plot-0');
  await expect.poll(async()=>(await read(page)).inventory.turnip).toBe(1);
  await page.getByRole('button',{name:'Backpack',exact:false}).click();
  await page.locator('[data-action="bag-tab"][data-tab="produce"]').click();
  await page.locator('[data-action="select-item"][data-item="turnip"]').click();
  await page.locator('[data-action="ship-item"][data-item="turnip"]').click();
  expect((await read(page)).shipping.turnip).toBe(1);
  await close(page);
  await openMenu(page,'home');
  await expect(page.locator('[data-action="sleep"]')).toBeVisible();
  await page.locator('[data-action="sleep"]').click();
  expect((await read(page)).day).toBe(2);
  expect((await read(page)).gold).toBe(715);
  expect((await read(page)).plots.find((p:any)=>p.id==='plot-20').growth).toBe(1);
  await close(page);
  await save(page);
  await page.reload();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.locator('[data-action="load-slot"][data-slot="0"]').click();
  expect((await read(page)).day).toBe(2);
  expect((await read(page)).farmName).toBe('Amber');
  expect((await read(page)).completed).toContain('new-roots');
});

test('market, animal care, world travel, conversation, gifts, and paused menus',async({page})=>{
  await start(page);
  await openMenu(page,'market');
  await page.locator('[data-action="buy"][data-item="turnip_seed"]').click();
  expect((await read(page)).inventory.turnip_seed).toBe(13);
  expect((await read(page)).gold).toBe(480);
  const time=(await read(page)).time;
  await page.waitForTimeout(1200);
  expect((await read(page)).time).toBe(time);
  for(let i=0;i<2;i++)await page.getByRole('button',{name:'Next',exact:false}).click();
  await expect(page.locator('[data-action="buy"][data-item="corn_seed"]')).toBeVisible();
  await page.locator('[data-action="market-tab"][data-tab="animals"]').click();
  await page.locator('[data-action="buy-animal"][data-kind="chicken"]').click();
  expect((await read(page)).animals).toHaveLength(2);
  await close(page);
  await openMenu(page,'map');
  await page.locator('[data-action="travel"][data-area="village"]').click();
  expect((await read(page)).player.area).toBe('village');
  await openMenu(page,'people');
  await page.locator('[data-action="person"][data-person="mira"]').click();
  await page.locator('[data-action="talk"]').click();
  expect((await read(page)).stats.met).toBe(1);
  await expect(page.locator('[data-action="talk"]')).toBeDisabled();
  await page.locator('[data-action="gift-list"]').click();
  await page.locator('[data-action="gift-item"][data-item="berry"]').click();
  expect((await read(page)).inventory.berry).toBe(2);
  await expect(page.locator('[data-action="gift-list"]')).toBeDisabled();
  await close(page);
  await openMenu(page,'map');
  await page.locator('[data-action="travel"][data-area="farm"]').click();
  await openMenu(page,'animals');
  await expect(page.locator('[data-care="feed"]').first()).toBeVisible();
  await page.locator('[data-care="feed"]').first().click();
  await page.locator('[data-care="pet"]').first().click();
  await page.locator('[data-care="collect"]').first().click();
  expect((await read(page)).inventory.egg).toBe(1);
  expect((await read(page)).stats.care).toBe(2);
});

test('fishing uses a timed three-reel minigame',async({page})=>{
  await start(page);
  await openMenu(page,'map');
  await page.locator('[data-action="travel"][data-area="lake"]').click();
  await page.getByRole('button',{name:'Choose tool',exact:true}).click();
  await page.locator('#modal').getByRole('button',{name:'Fishing rod',exact:true}).click();
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(3800);await page.keyboard.up('ArrowRight');
  await page.getByRole('button',{name:'Fish nearby',exact:true}).click();
  await expect(page.locator('[data-action="cast"]')).toBeVisible();
  await page.locator('[data-action="cast"]').click();
  await expect(page.locator('#fish-marker')).toBeVisible({timeout:5000});
  await page.locator('[data-action="reel"]').focus();
  // Wait for the visible marker's actual position; keep normal timing and no state changes.
  for(let reel=0;reel<3;reel++) {
    await page.waitForFunction(()=>{const x=parseFloat(document.querySelector<HTMLElement>('#fish-marker')!.style.left);return x>=39&&x<=57;},undefined,{polling:'raf',timeout:5000});
    await page.keyboard.press('Space');
    if(reel<2)await page.waitForTimeout(300);
  }
  await expect.poll(async()=>(await read(page)).stats.fish).toBe(1);
  const s=await read(page);
  expect(['carp','perch','trout','moonfish'].some(id=>s.inventory[id]===1)).toBe(true);
});

test('settings, local rating, sharing view, save export and invalid import',async({page})=>{
  await start(page);
  await openMenu(page,'settings');
  await page.locator('[data-action="settings-tab"][data-tab="game"]').click();
  await expect(page.locator('#language')).toHaveValue('en');
  await page.locator('[data-action="settings-tab"][data-tab="display"]').click();
  await page.locator('#text-size').check();
  await page.locator('[data-action="settings-tab"][data-tab="sound"]').click();
  await page.locator('#ambient-toggle').uncheck();
  await expect(page.locator('#app')).toHaveClass(/large-text/);
  await page.locator('[data-action="settings-tab"][data-tab="game"]').click();
  await page.locator('#pace').selectOption('0.7');
  await page.locator('[data-action="settings-tab"][data-tab="saves"]').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('[data-action="export"]').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toContain('dewhaven-amber');
  await page.locator('#modal [data-action="about"]').click();
  await page.locator('#modal').getByRole('button',{name:'Rate',exact:true}).click();
  await page.getByRole('button',{name:'4 stars',exact:true}).click();
  await page.locator('#rating-comment').fill('The valley feels peaceful.');
  await page.locator('#rating-form button[type="submit"]').click();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.feedback')||'null'))).toMatchObject({stars:4,comment:'The valley feels peaceful.'});
  await openMenu(page,'settings');
  await page.locator('#modal [data-action="about"]').click();
  await page.locator('#modal').getByRole('button',{name:'Share',exact:true}).click();
  await expect(page.locator('#share-text')).toContainText('Amber Homestead');
  await close(page);
  await openMenu(page,'settings');
  await page.locator('#save-import').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"state":{"gold":-8}}')});
  expect((await read(page)).farmName).toBe('Amber');
  await expect(page.locator('.toast.error').last()).toBeVisible();
  await page.reload();
  await openMenu(page,'settings');
  await page.locator('[data-action="settings-tab"][data-tab="display"]').click();
  await expect(page.locator('#text-size')).toBeChecked();
  await page.locator('[data-action="settings-tab"][data-tab="sound"]').click();
  await expect(page.locator('#ambient-toggle')).not.toBeChecked();
  await page.locator('[data-action="settings-tab"][data-tab="game"]').click();
  await expect(page.locator('#pace')).toHaveValue('0.7');
});

test('imported late-game state supports crafting, quests, upgrades and proposals',async({page})=>{
  const s=createGame('Robin','Amber');s.tutorialDone=true;s.gold=20000;s.skills.mining=900;
  s.inventory={wood:60,stone:40,copper:30,iron:30,crystal:12,flower:20,egg:5,turnip:10,trout:3,feed:10};
  s.friendships.mira.points=800;
  await page.addInitScript(data=>localStorage.setItem('dewhaven.save.0',data),encodeSave(s));
  await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('[data-action="load-slot"]').first().click();
  await page.keyboard.press('f');
  await page.locator('[data-action="craft-tab"][data-tab="workshop"]').click();
  await page.locator('[data-action="make"][data-recipe="sprinkler"]').click();
  expect((await read(page)).inventory.sprinkler).toBe(1);
  await page.getByRole('button',{name:'Next',exact:false}).click();
  await page.locator('[data-action="make"][data-recipe="ring"]').click();
  expect((await read(page)).inventory.ring).toBe(1);
  await close(page);
  await openMenu(page,'people');
  await page.locator('[data-action="person"][data-person="mira"]').click();
  await page.locator('[data-action="propose"]').click();
  expect((await read(page)).partner).toBe('mira');
});

test('main screen fits desktop and mobile; visible tool labels stay inside buttons',async({page})=>{
  await start(page);
  for(const [width,height] of [[1440,900],[1024,768],[920,720],[390,844],[320,667],[844,390]]) {
    await page.setViewportSize({width,height});
    await expect.poll(async()=>page.evaluate(()=>document.body.scrollHeight<=innerHeight+1&&document.body.scrollWidth<=innerWidth+1)).toBe(true);
    const issues=await page.evaluate(()=>[...document.querySelectorAll<HTMLElement>('.tool-label')].filter(el=>{const a=el.getBoundingClientRect(),b=el.closest('button')!.getBoundingClientRect();return a.left<b.left-1||a.right>b.right+1;}).map(el=>el.textContent));
    expect(issues,`${width} × ${height}: labels overflow`).toEqual([]);
  }
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'Journal',exact:true}).click();
  await expect(page.locator('.quest-card')).toHaveCount(1);
  await page.locator('[data-action="journal-tab"][data-tab="side"]').click();
  await expect(page.locator('.quest-card')).toHaveCount(1);
  await page.getByRole('button',{name:'Next',exact:false}).click();
  await expect(page.locator('.quest-card h3')).toContainText('breakfast');
  await expect(page.locator('.modal-wrap')).toBeVisible();
});

test('walking stops at fences, and click navigation enters through the gate',async({page})=>{
  const s=createGame('Robin','Amber');s.tutorialDone=true;s.player.x=25.5;s.player.y=21.5;
  await page.addInitScript(data=>localStorage.setItem('dewhaven.save.0',data),encodeSave(s));
  await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).click();await page.locator('[data-action="load-slot"]').first().click();
  await page.keyboard.down('w');await page.waitForTimeout(850);await page.keyboard.up('w');
  const position=(await read(page)).player;
  expect(position.y).toBeGreaterThan(20.15);expect(position.y).toBeLessThan(20.6);
  await page.locator('[data-action="tool"][data-tool="hoe"]').click();
  await patch(page,'plot-22');
  await expect.poll(async()=>(await read(page)).plots[22].tilled,{timeout:8000}).toBe(true);
  expect((await read(page)).player.y).toBeLessThan(20);
});
test('a device with unavailable storage can still create and play a story',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage disabled','SecurityError');}}));
  await start(page);
  expect((await read(page)).farmName).toBe('Amber');
  await save(page);
  await expect(page.locator('.toast.error').last()).toBeVisible();
});

test('touch controls walk and release without a stuck direction',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();await page.goto('http://localhost:5176');await start(page);
  await expect(page.locator('.mobile-controls')).toBeVisible();
  const before=(await read(page)).player.x;
  const box=(await page.locator('#movement-joystick').boundingBox())!,cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:box.x+box.width/2,y:box.y+box.height/2}]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:box.x+box.width/2+27,y:box.y+box.height/2}]});
  await page.waitForTimeout(400);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(200);
  await expect.poll(async()=>(await read(page)).player.x).toBeGreaterThan(before);
  const after=(await read(page)).player.x;
  await page.waitForTimeout(300);
  expect((await read(page)).player.x).toBeCloseTo(after,2);
  await context.close();
});

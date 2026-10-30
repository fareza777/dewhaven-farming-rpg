import { test, expect, type Page } from '@playwright/test';
import { createGame } from '../../src/game/simulation.ts';
import { encodeSave } from '../../src/game/save.ts';

test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
test.setTimeout(45000);
async function load(page:Page) {
  const s=createGame('Robin','Amber');s.tutorialDone=true;s.player.x=23.5;s.player.y=20.6;
  await page.addInitScript(data=>{if(!localStorage.getItem('dewhaven.save.0'))localStorage.setItem('dewhaven.save.0',data);},encodeSave(s));
  await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).tap();
  await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
}
async function settings(page:Page) {
  await page.getByRole('button',{name:'More menu',exact:true}).tap();
  await page.locator('#modal').getByRole('button',{name:'Settings',exact:true}).tap();
}

test('the default floating joystick starts where the thumb touches and releases cleanly',async({page})=>{
  await load(page);
  expect(await page.evaluate(()=>(window as any).__dewhaven.settings.controls?.mode)).toBe('floating');
  const cdp=await page.context().newCDPSession(page);
  for(const [x,y] of [[85,460],[120,550]]){
    const before=await page.evaluate(()=>(window as any).__dewhaven.state.player.x);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x,y}]});
    await expect(page.locator('#movement-joystick')).toHaveClass(/is-floating/);
    const box=(await page.locator('#movement-joystick').boundingBox())!;
    expect(box.x+box.width/2).toBeCloseTo(x,0);expect(box.y+box.height/2).toBeCloseTo(y,0);
    expect(await page.evaluate(()=>(window as any).__dewhaven.world.touch.x)).toBe(0);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:x+28,y}]});
    await expect.poll(()=>page.evaluate(()=>(window as any).__dewhaven.state.player.x)).toBeGreaterThan(before);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    await expect(page.locator('#movement-joystick')).not.toHaveClass(/is-floating/);
    expect(await page.evaluate(()=>(window as any).__dewhaven.world.touch)).toEqual({x:0,y:0});
    await page.waitForTimeout(200);
    const stopped=await page.evaluate(()=>(window as any).__dewhaven.state.player.x);
    await page.waitForTimeout(200);
    expect(await page.evaluate(()=>(window as any).__dewhaven.state.player.x)).toBeCloseTo(stopped,2);
  }
});

test('control customization applies immediately, fits small phones and persists after reload',async({page})=>{
  await load(page);await settings(page);
  await page.locator('#mode').selectOption('fixed');await page.locator('#hand').selectOption('left');
  await page.locator('#control-size').press('End');await page.locator('#control-height').press('End');
  await page.locator('#control-opacity').press('Home');
  await page.getByRole('button',{name:'Response →',exact:true}).tap();
  await page.locator('#control-sensitivity').press('End');await page.locator('#control-deadzone').press('Home');
  await page.locator('#control-camera').press('Home');await page.locator('#tap-to-move').uncheck();await page.locator('#haptics-toggle').uncheck();
  await page.locator('[data-action="settings-tab"][data-tab="display"]').tap();
  await page.locator('#show-hud').uncheck();await page.locator('#reduce-motion').check();await page.locator('#quality').selectOption('30');
  await page.getByRole('button',{name:'Close',exact:true}).tap();
  await expect(page.locator('.compact-hud')).toBeHidden();
  for(const [width,height] of [[320,667],[390,844],[412,915]]){
    await page.setViewportSize({width,height});
    const boxes=await page.locator('.joystick,.touch-interact,.quick-tool,.world-menu button').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,name:el.getAttribute('aria-label')};}));
    for(const b of boxes){expect(b.w).toBeGreaterThanOrEqual(44);expect(b.h).toBeGreaterThanOrEqual(44);expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.w).toBeLessThanOrEqual(width);expect(b.y+b.h).toBeLessThanOrEqual(height);}
    for(let a=0;a<boxes.length;a++)for(let b=a+1;b<boxes.length;b++){const x=boxes[a],y=boxes[b];expect(Math.min(x.x+x.w,y.x+y.w)>Math.max(x.x,y.x)&&Math.min(x.y+x.h,y.y+y.h)>Math.max(x.y,y.y),`${x.name} overlaps ${y.name}`).toBe(false);}
    expect((await page.locator('.joystick').boundingBox())!.x).toBeGreaterThan((await page.locator('.touch-interact').boundingBox())!.x);
  }
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('dewhaven.settings')!));
  expect(saved.controls).toMatchObject({mode:'fixed',hand:'left',size:1.2,opacity:.35,height:80,sensitivity:1.5,deadzone:.05,camera:.6,tapToMove:false});
  expect(saved.quality).toBe(30);expect(saved.haptics).toBe(false);
  await page.reload();await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
  await expect(page.locator('.immersive-game')).toHaveClass(/left-handed/);await expect(page.locator('.compact-hud')).toBeHidden();
  await settings(page);await page.getByRole('button',{name:'Reset controls',exact:true}).tap();
  await expect(page.locator('#mode')).toHaveValue('floating');await expect(page.locator('#hand')).toHaveValue('right');
  expect(await page.evaluate(()=>(window as any).__dewhaven.state.farmName)).toBe('Amber');
  await page.screenshot({path:'docs/screenshots/controls-settings.png'});
});

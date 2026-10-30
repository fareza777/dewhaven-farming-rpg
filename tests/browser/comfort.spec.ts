import { test,expect } from '@playwright/test';
import { createGame } from '../../src/game/simulation.ts';
import { encodeSave } from '../../src/game/save.ts';
test.use({viewport:{width:320,height:667},isMobile:true,hasTouch:true});
test('phone text and larger tool controls fit with a long farm name and a billion gold',async({page})=>{
 const s=createGame('Robin','The Copperbell Homestead');s.tutorialDone=true;s.gold=1000000000;
 await page.addInitScript(save=>localStorage.setItem('dewhaven.save.0',save),encodeSave(s));
 await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
 for(const [width,height] of [[320,667],[390,844]]){
  await page.setViewportSize({width,height});
  const layout=await page.evaluate(()=>{
   const box=(q:string)=>{const el=document.querySelector(q)!,r=el.getBoundingClientRect();return{left:r.left,right:r.right,width:r.width,height:r.height,font:parseFloat(getComputedStyle(el).fontSize)};};
   return{day:box('.day-hud'),money:box('.money-hud'),clock:box('#hud-clock'),energy:box('#hud-energy'),tool:box('.quick-tool'),action:box('.touch-interact'),label:box('.touch-interact>span')};
  });
  expect(layout.day.right).toBeLessThan(layout.money.left);expect(layout.money.right).toBeLessThan(width-55);expect(layout.clock.font).toBeGreaterThanOrEqual(14);expect(layout.energy.font).toBeGreaterThanOrEqual(14);expect(layout.tool.width).toBeGreaterThanOrEqual(48);expect(layout.action.width).toBeGreaterThanOrEqual(88);expect(layout.label.font).toBeGreaterThanOrEqual(16);
 }
 await expect(page.locator('.money-hud')).toHaveAttribute('aria-label','Gold: 1,000,000,000');
 await page.getByRole('button',{name:'Hoe',exact:true}).tap();await expect(page.getByRole('button',{name:'Hoe nearby',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Water',exact:true}).tap();await expect(page.getByRole('button',{name:'Water nearby',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'More menu',exact:true}).tap();await page.locator('#modal [data-action="home"]').tap();
 const header=await page.locator('.cinematic-top').evaluate(el=>{const title=el.querySelector('span')!.getBoundingClientRect(),close=el.querySelector('button')!.getBoundingClientRect();return{titleEnd:title.right,buttonStart:close.left};});expect(header.titleEnd).toBeLessThanOrEqual(header.buttonStart);
});

test('initial and duplicate Android resume notifications cannot interrupt active farming',async({page})=>{
 const s=createGame();s.tutorialDone=true;
 await page.addInitScript(save=>localStorage.setItem('dewhaven.save.0',save),encodeSave(s));
 await page.goto('/');await page.getByRole('button',{name:'Continue',exact:true}).tap();await page.locator('[data-action="load-slot"][data-slot="0"]').tap();
 await page.evaluate(()=>(window as any).__dewhaven.foreground());await expect(page.locator('#modal')).not.toBeVisible();
 await page.evaluate(()=>{const app=(window as any).__dewhaven;app.background();app.foreground();});await expect(page.getByRole('heading',{name:'Paused',exact:true})).toBeVisible();
 await page.locator('#modal [data-action="close"]').last().tap();await page.evaluate(()=>(window as any).__dewhaven.foreground());await expect(page.locator('#modal')).not.toBeVisible();
 expect(await page.evaluate(()=>(window as any).__dewhaven.world.paused)).toBe(false);
});

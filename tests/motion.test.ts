import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SmoothMotion } from '../src/world/motion.ts';

test('analog walking preserves stick strength and caps diagonal speed', () => {
  const half=new SmoothMotion(),full=new SmoothMotion(),diagonal=new SmoothMotion();
  for(let i=0;i<120;i++){half.update(.5,0,1/60);full.update(1,0,1/60);diagonal.update(1,1,1/60);}
  assert.ok(Math.abs(half.x/full.x-.5)<.001);
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-full.x)<.001);
  assert.ok(full.x>3.6&&full.x<=3.7);
});
test('steering feels the same at 30 and 120 fps, and release stops promptly', () => {
  const slow=new SmoothMotion(),fast=new SmoothMotion();
  for(let i=0;i<30;i++)slow.update(1,0,1/30);
  for(let i=0;i<120;i++)fast.update(1,0,1/120);
  assert.ok(Math.abs(slow.x-fast.x)<.001);
  assert.ok(slow.update(0,0,1/60).x<3);
  for(let i=0;i<12;i++)slow.update(0,0,1/60);
  assert.equal(slow.x,0);
  fast.reset();assert.equal(fast.x,0);assert.equal(fast.y,0);
});

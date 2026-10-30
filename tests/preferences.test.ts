import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readSettings } from '../src/preferences.ts';

test('old preferences migrate to floating controls without losing sound or language',()=>{
  const s=readSettings({language:'id',ambient:false,volume:.65,haptics:false});
  assert.equal(s.controls.mode,'floating');assert.equal(s.controls.hand,'right');
  assert.equal(s.ambient,false);assert.equal(s.volume,.65);assert.equal(s.language,'id');assert.equal(s.haptics,false);
});
test('control preferences preserve valid customization and bound corrupt values',()=>{
  const s=readSettings({controls:{mode:'fixed',hand:'left',size:10,opacity:-1,height:Infinity,sensitivity:NaN,deadzone:.2,camera:.8,tapToMove:false},quality:30});
  assert.equal(s.controls.mode,'fixed');assert.equal(s.controls.hand,'left');assert.equal(s.controls.size,1.2);
  assert.equal(s.controls.opacity,.35);assert.equal(s.controls.height,0);assert.equal(s.controls.sensitivity,1);
  assert.equal(s.controls.deadzone,.2);assert.equal(s.controls.camera,.8);assert.equal(s.controls.tapToMove,false);assert.equal(s.quality,30);
  assert.deepEqual(readSettings(JSON.parse(JSON.stringify(s))),s);
});

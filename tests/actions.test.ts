import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ActionAnimator, ACTION_DURATION } from '../src/world/actions.ts';
import type { Tool } from '../src/game/types.ts';

test('all seven tools have a complete action and one physical impact', () => {
  for (const tool of Object.keys(ACTION_DURATION) as Tool[]) {
    const action = new ActionAnimator(); let hits = 0;
    assert.equal(action.begin(tool, { x: 12, y: 15 }, 'left', () => hits++), true);
    action.update(.01);
    assert.equal(hits, 0);
    assert.equal(action.current?.direction, 'left');
    action.update(.46 * ACTION_DURATION[tool]);
    assert.equal(hits, 1, tool);
    action.update(5); action.update(5);
    assert.equal(hits, 1, `${tool} impact was duplicated`);
    assert.equal(action.current, null);
  }
});
test('another action cannot replace a tool swing before it finishes', () => {
  const action = new ActionAnimator(); let hits = 0;
  action.begin('axe', { x: 10, y: 12 }, 'up', () => hits++);
  assert.equal(action.begin('pickaxe', { x: 20, y: 20 }, 'down', () => hits++), false);
  assert.equal(action.current?.tool, 'axe');
  action.update(1);
  assert.equal(hits, 1);
  assert.equal(action.begin('pickaxe', { x: 20, y: 20 }, 'down', () => hits++), true);
});

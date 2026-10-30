import type { Tool, Direction } from '../game/types.ts';
import type { WorldObject } from './maps.ts';

export const ACTION_DURATION: Record<Tool, number> = { hand: .48, hoe: .64, water: .9, seed: .62, axe: .72, pickaxe: .66, rod: .82 };
export interface ToolAnimation {
  tool: Tool;
  elapsed: number;
  duration: number;
  target: { x: number; y: number };
  direction: Direction;
  object?: WorldObject;
  impacted: boolean;
  impact: () => void;
}
/** One physical action at a time. Its impact fires once, even after a slow frame. */
export class ActionAnimator {
  current: ToolAnimation | null = null;
  begin(tool: Tool, target: { x: number; y: number }, direction: Direction, impact: () => void, object?: WorldObject) {
    if (this.current) return false;
    this.current = { tool, target, direction, elapsed: 0, duration: ACTION_DURATION[tool], impacted: false, impact, object };
    return true;
  }
  update(dt: number) {
    const a = this.current;
    if (!a) return;
    a.elapsed = Math.min(a.duration, a.elapsed + Math.max(0, dt));
    const contact = a.tool === 'water' ? .25 : .45;
    if (!a.impacted && a.elapsed / a.duration >= contact) { a.impacted = true; a.impact(); }
    if (a.elapsed >= a.duration) this.current = null;
  }
}

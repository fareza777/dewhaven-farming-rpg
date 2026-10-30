import type { Area, GameState } from '../game/types.ts';
import { CROPS, VILLAGERS } from '../game/content.ts';
import { MAPS, findPath, isBlocked, objectVisible, animalPositions } from './maps.ts';
import type { WorldObject } from './maps.ts';
import { Renderer } from './renderer.ts';
import type { Assets } from './assets.ts';
import { SmoothMotion } from './motion.ts';
import { visitArea } from '../game/expeditions.ts';

export type Target = {type:'plot';id:string;x:number;y:number}|{type:'object';object:WorldObject;x:number;y:number}|{type:'npc';id:string;x:number;y:number}|{type:'animal';id:string;x:number;y:number};
export class WorldController {
  state:GameState;renderer:Renderer;keys=new Set<string>();path:Array<[number,number]>=[];pending:Target|null=null;
  paused=false;last=0;lastDraw=0;frame=0;minutes=0;stepTime=0;onStep:()=>void=()=>{};onAction:(target:Target|null)=>void;onClock:()=>void;onTravel:(area:Area)=>void;
  cleanup:Array<()=>void>=[];touch={x:0,y:0};touchRun=false;actionHeld=false;repeatDelay=0;warpDelay=0;focusedTarget:Target|null=null;tapToMove=true;renderFPS=60;
  motion=new SmoothMotion();onBusy:(busy:boolean)=>void=()=>{};onFocus:()=>void=()=>{};wasBusy=false;
  constructor(canvas:HTMLCanvasElement,assets:Assets,state:GameState,onAction:(t:Target|null)=>void,onClock:()=>void,onTravel:(a:Area)=>void) {
    this.state=state;this.renderer=new Renderer(canvas,assets,state);this.onAction=onAction;this.onClock=onClock;this.onTravel=onTravel;
    this.listen(window,'keydown',((e:KeyboardEvent)=>{if(this.paused||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement||e.target instanceof HTMLSelectElement)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d'].includes(e.key))e.preventDefault();this.keys.add(e.key.toLowerCase());if((e.code==='Space'||e.key.toLowerCase()==='e')&&!e.repeat)this.interact();}) as EventListener);
    this.listen(window,'keyup',((e:KeyboardEvent)=>{this.keys.delete(e.key.toLowerCase());}) as EventListener);
    this.listen(window,'blur',()=>this.clear());
    this.listen(canvas,'pointermove',((e:PointerEvent)=>{this.renderer.hover=this.renderer.toWorld(e.clientX,e.clientY);}) as EventListener);
    this.listen(canvas,'pointerleave',()=>{this.renderer.hover=null;});
    this.listen(canvas,'pointerdown',((e:PointerEvent)=>{if(this.paused||!this.tapToMove)return;const p=this.renderer.toWorld(e.clientX,e.clientY);this.click(p.x,p.y);}) as EventListener);
    const observer=new ResizeObserver(()=>this.renderer.resize());observer.observe(canvas);this.cleanup.push(()=>observer.disconnect());
    this.frame=requestAnimationFrame(t=>this.loop(t));
  }
  private listen(target:EventTarget,event:string,fn:EventListener) {target.addEventListener(event,fn);this.cleanup.push(()=>target.removeEventListener(event,fn));}
  clear() {this.keys.clear();this.path=[];this.pending=null;this.touch={x:0,y:0};this.touchRun=false;this.actionHeld=false;this.focusedTarget=null;this.renderer.aim=null;this.motion.reset();}
  stop() {cancelAnimationFrame(this.frame);this.cleanup.forEach(f=>f());}
  travel(area:Area,point?:[number,number]) {const from=MAPS[this.state.player.area];this.clear();const spawn=point||MAPS[area].spawn;this.state.player={area,x:spawn[0],y:spawn[1],direction:'down'};this.state.time=Math.min(1380,this.state.time+(from.interior||MAPS[area].interior?0:15));visitArea(this.state,area);this.warpDelay=.8;this.renderer.resize();this.renderer.arrival();this.onTravel(area);}
  targets():Target[] {
    const s=this.state;const targets:Target[]=MAPS[s.player.area].objects.filter(o=>objectVisible(s,o)&&o.kind!=='decor').map(o=>({type:'object',object:o,x:o.x+.5,y:o.y+1.5}));
    if(s.player.area==='farm')s.plots.forEach(p=>targets.push({type:'plot',id:p.id,x:p.x+.5,y:p.y+.5}));
    animalPositions(s).forEach(a=>targets.push({type:'animal',id:a.animal.id,x:a.x,y:a.y}));
    for(const v of VILLAGERS.filter(v=>v.area===s.player.area))targets.push({type:'npc',id:v.id,x:v.x+.5,y:v.y+1.3});return targets;
  }
  click(x:number,y:number) {
    if(this.renderer.toolAnimation)return;
    const target=this.targets().filter(t=>Math.abs(t.x-x)<(t.type==='object'&&t.object.kind==='building'?2.5:.8)&&Math.abs(t.y-y)<(t.type==='object'&&t.object.kind==='building'?3:1)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
    if(target&&Math.hypot(target.x-this.state.player.x,target.y-this.state.player.y)<2.3) {this.face(target.x,target.y);this.onAction(target);return;}
    const dest=target?{x:target.x,y:target.y}: {x,y};
    const options=[[dest.x,dest.y],[dest.x,dest.y+1],[dest.x-1,dest.y],[dest.x+1,dest.y],[dest.x,dest.y-1]];
    for(const [tx,ty] of options) {const path=findPath(this.state,tx,ty);if(path.length){this.path=path;this.pending=target||null;return;}}
  }
  private face(x:number,y:number) {const dx=x-this.state.player.x,dy=y-this.state.player.y;this.state.player.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';}
  findTarget():Target|null {
    const s=this.state;const tool=s.selectedTool;
    const dir=s.player.direction,dx=dir==='left'?-1:dir==='right'?1:0,dy=dir==='up'?-1:dir==='down'?1:0;
    let candidates=this.targets().filter(t=>Math.hypot(t.x-s.player.x,t.y-s.player.y)<2.35);
    if(['hoe','water','seed'].includes(tool))candidates=candidates.filter(t=>t.type==='plot');
    if(tool==='axe')candidates=candidates.filter(t=>t.type==='object'&&t.object.resource==='wood');
    if(tool==='pickaxe')candidates=candidates.filter(t=>t.type==='object'&&['stone','ore'].includes(t.object.resource||''));
    candidates.sort((a,b)=>{const score=(t:Target)=>Math.hypot(t.x-s.player.x,t.y-s.player.y)-((t.x-s.player.x)*dx+(t.y-s.player.y)*dy)*.45;return score(a)-score(b);});
    if(['hoe','water','seed'].includes(tool))candidates=candidates.filter(t=>{if(t.type!=='plot')return false;const plot=s.plots.find(p=>p.id===t.id)!;return tool==='hoe'?!plot.tilled&&!plot.crop:tool==='seed'?plot.tilled&&!plot.crop:plot.tilled&&!plot.watered;});
    if(tool==='hand')candidates=candidates.filter(t=>t.type!=='plot'||s.plots.some(p=>p.id===t.id&&p.crop&&p.growth>=CROPS[p.crop].days));
    const nearbyRoom=MAPS[s.player.area].interior?this.targets().filter(t=>t.type==='object'&&!t.object.resource&&t.object.action&&Math.hypot(t.x-s.player.x,t.y-s.player.y)<1.5)[0]:null;
    return candidates[0]||nearbyRoom||null;
  }
  interact() {
    if(this.paused||this.renderer.toolAnimation)return;const target=this.findTarget();if(target)this.face(target.x,target.y);this.path=[];this.pending=null;this.motion.reset();this.repeatDelay=.12;this.onAction(target);
  }
  private loop(timestamp:number) {
    const dt=Math.min(.05,(timestamp-(this.last||timestamp))/1000);this.last=timestamp;
    const active=!this.paused&&!document.hidden;
    this.repeatDelay=Math.max(0,this.repeatDelay-dt);this.warpDelay=Math.max(0,this.warpDelay-dt);
    if(active){let dx=0,dy=0;
      if(!this.renderer.toolAnimation){
      if(this.keys.has('w')||this.keys.has('arrowup'))dy--;
      if(this.keys.has('s')||this.keys.has('arrowdown'))dy++;
      if(this.keys.has('a')||this.keys.has('arrowleft'))dx--;
      if(this.keys.has('d')||this.keys.has('arrowright'))dx++;
      dx+=this.touch.x;dy+=this.touch.y;
      if(dx||dy){this.path=[];this.pending=null;}
      else if(this.path.length){const [tx,ty]=this.path[0],p=this.state.player;dx=tx-p.x;dy=ty-p.y;const distance=Math.hypot(dx,dy);if(distance<.08){p.x=tx;p.y=ty;this.path.shift();dx=0;dy=0;this.motion.reset();}else{const strength=Math.min(1,distance*6);dx=dx/distance*strength;dy=dy/distance*strength;}}
      const velocity=this.motion.update(dx,dy,dt,(this.keys.has('shift')||this.touchRun)&&this.state.energy>=12);this.renderer.walkSpeed=Math.max(.45,Math.hypot(velocity.x,velocity.y)/3.7);
      const moving=Math.hypot(velocity.x,velocity.y)>.015;this.renderer.walking=moving;
      if(moving){const p=this.state.player,beforeX=p.x,beforeY=p.y;if(dx||dy)this.face(p.x+dx,p.y+dy);dx=velocity.x*dt;dy=velocity.y*dt;
        if(!isBlocked(this.state,p.x+dx,p.y))p.x+=dx;
        if(!isBlocked(this.state,p.x,p.y+dy))p.y+=dy;
        this.renderer.walking=Math.hypot(p.x-beforeX,p.y-beforeY)>.001;
        if(this.renderer.walking){this.stepTime+=dt*this.renderer.walkSpeed;if(this.stepTime>.3){this.stepTime=0;this.onStep();}}
        if(!this.warpDelay){const door=MAPS[p.area].objects.find(o=>o.destination&&(o.kind==='exit'?this.renderer.walking&&Math.hypot(p.x-(o.x+.5),p.y-(o.y+1.5))<.65:dy<0&&Math.abs(p.x-(o.x+.5))<.65&&p.y>=o.y+1&&p.y<o.y+1.6));if(door){this.onAction({type:'object',object:door,x:door.x+.5,y:door.y+1.5});}}
      }
      if(this.pending&&Math.hypot(this.pending.x-this.state.player.x,this.pending.y-this.state.player.y)<1.65){const target=this.pending;this.pending=null;this.path=[];this.face(target.x,target.y);this.onAction(target);}
      if(!this.path.length&&this.pending){this.pending=null;}
      const before=this.focusedTarget,focused=this.findTarget(),key=(t:Target|null)=>t?.type==='object'?t.object.id:t?.id;
      this.focusedTarget=focused;this.renderer.aim=focused&&(focused.type==='plot'||focused.type==='object'&&!!focused.object.resource)?focused:null;if(key(before)!==key(focused))this.onFocus();
      if(this.actionHeld&&this.repeatDelay<=0&&!this.renderer.toolAnimation){const t=this.focusedTarget;if(t&&(t.type==='plot'||t.type==='object'&&t.object.resource))this.interact();else this.actionHeld=false;}
      } else {this.renderer.walking=false;this.motion.reset();}
      this.minutes+=dt*this.timeRate;
      if(this.minutes>=1){const n=Math.floor(this.minutes);this.minutes-=n;this.state.time=Math.min(1380,this.state.time+n);this.onClock();}
    } else {this.renderer.walking=false;this.motion.reset();}
    const busy=!!this.renderer.toolAnimation;if(busy!==this.wasBusy){this.wasBusy=busy;this.onBusy(busy);}
    if(!this.lastDraw||timestamp-this.lastDraw>=(active||this.renderer.toolAnimation?1000/this.renderFPS-1:140)){this.renderer.draw(this.lastDraw?Math.min(.15,(timestamp-this.lastDraw)/1000):dt);this.lastDraw=timestamp;}
    this.frame=requestAnimationFrame(t=>this.loop(t));
  }
  timeRate=1.4;
}

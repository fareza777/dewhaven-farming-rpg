import { CROPS, VILLAGERS } from '../game/content.ts';
import type { GameState, Tool } from '../game/types.ts';
import { MAPS, FENCES, hash, objectVisible, animalPositions } from './maps.ts';
import type { FenceSegment, WorldObject, WorldMap, Ground } from './maps.ts';
import type { Assets } from './assets.ts';
import { ActionAnimator } from './actions.ts';
import type { ToolAnimation } from './actions.ts';

export interface Particle { x:number;y:number;age:number;text:string;color:string; }
export class Renderer {
  canvas:HTMLCanvasElement;ctx:CanvasRenderingContext2D;assets:Assets;state:GameState;
  scale=2;camera={x:0,y:0};time=0;walking=false;walkSpeed=1;hover:{x:number;y:number}|null=null;cameraResponse=1;reduceMotion=false;aim:{x:number;y:number}|null=null;
  groundCache=new Map<string,{ground:HTMLCanvasElement;tufts:Renderer['tufts'];frames:HTMLCanvasElement[]}>();
  particles:Particle[]=[];ground:HTMLCanvasElement|null=null;groundKey='';walkPhase=0;viewZoom=2;
  actions=new ActionAnimator();
  tufts:Array<{x:number;y:number;phase:number}>=[];
  grassFrames:HTMLCanvasElement[]=[];
  debris:Array<{x:number;y:number;vx:number;vy:number;age:number;life:number;color:string;size:number}>=[];
  ripples:Array<{x:number;y:number;age:number;life:number;tool:Tool}>=[];arrivalFade=0;
  get toolAnimation() {return this.actions.current;}
  constructor(canvas:HTMLCanvasElement,assets:Assets,state:GameState) {this.canvas=canvas;this.ctx=canvas.getContext('2d')!;this.assets=assets;this.state=state;this.resize();this.center();}
  resize() {this.canvas.width=Math.max(320,this.canvas.clientWidth);this.canvas.height=Math.max(280,this.canvas.clientHeight);this.scale=MAPS[this.state.player.area].interior?2:this.viewZoom;this.ctx.imageSmoothingEnabled=false;this.center();}
  center() {const m=MAPS[this.state.player.area];this.camera.x=Math.max(0,Math.min(m.w*16-this.canvas.width/this.scale,this.state.player.x*16-this.canvas.width/this.scale/2));this.camera.y=Math.max(0,Math.min(m.h*16-this.canvas.height/this.scale,this.state.player.y*16-this.canvas.height/this.scale*.56));}
  arrival() {if(this.reduceMotion)return;this.arrivalFade=1;this.camera.y=Math.max(0,this.camera.y-14);}
  footstep() {if(!this.walking||this.state.player.area==='mine')return;const p=this.state.player;for(let i=0;i<3;i++)this.debris.push({x:p.x*16+(i-1)*2,y:p.y*16+1,vx:(i-1)*4,vy:-3,age:0,life:.25,color:'#d7c8a0',size:1});}
  toWorld(clientX:number,clientY:number) {const rect=this.canvas.getBoundingClientRect();return {x:((clientX-rect.left)*this.canvas.width/rect.width/this.scale+this.camera.x)/16,y:((clientY-rect.top)*this.canvas.height/rect.height/this.scale+this.camera.y)/16};}
  effect(text:string,color='#f8f3d8') {this.particles.push({x:this.state.player.x*16,y:this.state.player.y*16-24,age:0,text,color});}
  animateTool(tool:Tool,target={x:this.state.player.x,y:this.state.player.y},impact:()=>void=()=>{},object?:WorldObject) {
    return this.actions.begin(tool,target,this.state.player.direction,()=>{this.scatter(tool,target);impact();},object);
  }
  makeGround() {
    const s=this.state,m=MAPS[s.player.area];
    const key=`${s.player.area}-${s.season}`,cached=this.groundCache.get(key);
    if(cached){this.ground=cached.ground;this.groundKey=key;this.tufts=cached.tufts;this.grassFrames=cached.frames;this.groundCache.delete(key);this.groundCache.set(key,cached);return;}
    const c=document.createElement('canvas');c.width=m.w*16;c.height=m.h*16;const ctx=c.getContext('2d')!;
    if(m.interior){this.paintInterior(ctx,m);this.tufts=[];this.grassFrames=[];this.cacheGround(c,key);return;}
    if(this.assets.terrain){this.paintOutdoor(ctx,m);this.cacheGround(c,key);return;}
    const tones=[['#acb68c','#a5af82','#9ca779','#929d71'],['#9cac7b','#96a674','#8c9b6a','#829361'],['#beb079','#b8aa73','#b2a36c','#ab9d67'],['#e5e7dc','#dfe2d5','#d9ddcf','#d3d8c8']][s.season];
    const grass=tones[1],dark=tones[3];
    const smooth=(v:number)=>v*v*(3-2*v);
    const colors=tones.map(t=>[parseInt(t.slice(1,3),16),parseInt(t.slice(3,5),16),parseInt(t.slice(5,7),16)]);
    const meadow=ctx.createImageData(c.width,c.height);
    // Soft connected meadow patches, with fine pixel dithering instead of a flat green fill.
    for(let py=0;py<c.height;py+=2)for(let px=0;px<c.width;px+=2){
      const gx=px/72,gy=py/72,ix=Math.floor(gx),iy=Math.floor(gy),sx=smooth(gx-ix),sy=smooth(gy-iy);
      const a=hash(ix,iy,11),b=hash(ix+1,iy,11),d=hash(ix,iy+1,11),e=hash(ix+1,iy+1,11);
      const n=(a+(b-a)*sx)*(1-sy)+(d+(e-d)*sx)*sy+(hash(px,py,4)-.5)*.08;
      const color=colors[Math.min(3,Math.max(0,Math.floor(n*4)))];
      for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const offset=((py+dy)*c.width+px+dx)*4;meadow.data[offset]=color[0];meadow.data[offset+1]=color[1];meadow.data[offset+2]=color[2];meadow.data[offset+3]=255;}
    }
    ctx.putImageData(meadow,0,0);
    this.tufts=[];
    this.grassFrames=Array.from({length:4},(_,frame)=>{const tile=document.createElement('canvas');tile.width=tile.height=16;const paint=tile.getContext('2d')!;paint.imageSmoothingEnabled=false;paint.filter=s.season===2?'sepia(.6) saturate(.55)':'saturate(.55) brightness(1.07)';this.assets.draw(paint,`grass/back/${frame}`,8,16);this.assets.draw(paint,`grass/front/${frame}`,8,16);return tile;});
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++) {
      const t=m.tiles[y][x],r=hash(x,y),px=x*16,py=y*16;
      if(t==='path') {
        ctx.fillStyle=s.season===3?'#d7d7c4':'#d7c297';ctx.fillRect(px,py,16,16);
        ctx.fillStyle='#c4ac81';if(r>.5)ctx.fillRect(px+2+Math.floor(r*7),py+5,2,1);if(r<.25)ctx.fillRect(px+10,py+11,3,1);
        ctx.fillStyle=grass;
        if(m.tiles[y-1]?.[x]!=='path') {ctx.fillRect(px,py,16,1);if(r>.45)ctx.fillRect(px+4,py+1,2,1);}
        if(m.tiles[y+1]?.[x]!=='path')ctx.fillRect(px,py+15,16,1);
        if(m.tiles[y]?.[x-1]!=='path')ctx.fillRect(px,py,1,16);
        if(m.tiles[y]?.[x+1]!=='path')ctx.fillRect(px+15,py,1,16);
      } else if(t==='water') {
        ctx.fillStyle='#589e9c';ctx.fillRect(px,py,16,16);
        ctx.fillStyle='#7fbcb0';
        if(m.tiles[y-1]?.[x]!=='water')ctx.fillRect(px,py,16,2);
        if(m.tiles[y+1]?.[x]!=='water')ctx.fillRect(px,py+14,16,2);
        if(m.tiles[y]?.[x-1]!=='water')ctx.fillRect(px,py,2,16);
        if(m.tiles[y]?.[x+1]!=='water')ctx.fillRect(px+14,py,2,16);
      } else if(t==='stone'||t==='floor') {
        ctx.fillStyle=t==='stone'?'#465652':'#7c8171';ctx.fillRect(px,py,16,16);
        ctx.fillStyle=t==='stone'?'#3d4b49':'#707666';ctx.fillRect(px+2,py+3,10,1);if(r>.6)ctx.fillRect(px+8,py+9,2,1);
        if(t==='stone'){ctx.fillStyle='#53625c';ctx.fillRect(px+1,py+1,13,2);}
      } else {
        ctx.fillStyle=dark;
        if(r>.45){const gx=px+Math.floor(hash(y,x)*11)+2,gy=py+Math.floor(r*11)+2;ctx.fillRect(gx,gy,1,2);ctx.fillRect(gx+2,gy-1,1,3);ctx.fillStyle=tones[0];ctx.fillRect(gx+1,gy+2,3,1);}
        if(r<.055){ctx.fillStyle=s.season===3?'#f4f3e8':r<.025?'#f2e8bc':'#d9c995';ctx.fillRect(px+7,py+7,3,1);ctx.fillRect(px+8,py+6,1,3);}
        if(s.season!==3&&r>.78&&!s.plots.some(p=>s.player.area==='farm'&&p.x===x&&p.y===y)&&!m.objects.some(o=>Math.abs(o.x-x)<1.2&&Math.abs(o.y-y)<1.3))this.tufts.push({x:(x+.5)*16,y:(y+.8)*16,phase:hash(y,x,8)*8});
      }
    }
    this.cacheGround(c,key);
  }
  private cacheGround(ground:HTMLCanvasElement,key:string) {
    this.ground=ground;this.groundKey=key;this.groundCache.set(key,{ground,tufts:this.tufts,frames:this.grassFrames});
    while(this.groundCache.size>3)this.groundCache.delete(this.groundCache.keys().next().value!);
  }
  private tile(ctx:CanvasRenderingContext2D,block:number,mask:number,x:number,y:number) {
    const image=this.assets.terrain!;const index=block*256+mask,cols=image.naturalWidth/16;
    ctx.drawImage(image,index%cols*16,Math.floor(index/cols)*16,16,16,x*16,y*16,16,16);
  }
  private mask(m:WorldMap,x:number,y:number,t:Ground) {
    let bits=0;const offsets=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]];
    offsets.forEach(([dx,dy],i)=>{const n=m.tiles[y+dy]?.[x+dx];if(n===undefined||n===t)bits|=1<<i;});return bits;
  }
  private paintOutdoor(ctx:CanvasRenderingContext2D,m:WorldMap) {
    ctx.imageSmoothingEnabled=false;this.tufts=[];
    this.grassFrames=Array.from({length:4},(_,frame)=>{const c=document.createElement('canvas');c.width=c.height=16;const p=c.getContext('2d')!;p.imageSmoothingEnabled=false;p.filter='saturate(.68)';this.assets.draw(p,`grass/back/${frame}`,8,16);this.assets.draw(p,`grass/front/${frame}`,8,16);return c;});
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++)this.tile(ctx,0,255,x,y);
    const patches:Array<[string,number,number]>=[['dark-a',4,3],['dark-b',3,3],['dark-c',3,3],['light-a',3,2],['light-b',2,2],['light-c',3,2],['light-d',3,3]];
    for(let y=0;y<m.h-3;y++)for(let x=0;x<m.w-4;x++)if(hash(x,y,18)<.08){
      const [name,w,h]=patches[Math.floor(hash(y,x,31)*patches.length)];
      let open=true;for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)if(m.tiles[yy][xx]!=='grass'||m.id==='farm'&&this.state.plots.some(p=>p.x===xx&&p.y===yy))open=false;
      if(open)this.assets.draw(ctx,`room/meadow-${name}`,x*16+w*8,(y+h)*16);
    }
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      const t=m.tiles[y][x],r=hash(x,y);
      if(t==='path'||t==='water')this.tile(ctx,t==='path'?1:4,this.mask(m,x,y,t),x,y);
      if(t==='path'&&m.theme==='coast'&&(y>=23||m.tiles[y-1]?.[x]==='water'&&m.tiles[y+1]?.[x]==='water'))this.assets.draw(ctx,'room/floor',x*16+8,y*16+16);
      if(t==='grass'&&r<.07)this.assets.draw(ctx,`room/wildflowers-${r<.025?'a':r<.05?'b':'c'}`,x*16+8,y*16+16);
      if(t==='grass'&&r>.86&&this.state.season!==3&&!m.objects.some(o=>Math.abs(o.x-x)<1.2&&Math.abs(o.y-y)<1.5)&&!(m.id==='farm'&&this.state.plots.some(p=>p.x===x&&p.y===y)))this.tufts.push({x:(x+.5)*16,y:(y+.8)*16,phase:hash(y,x,8)*8});
    }
    ctx.fillStyle=['#d8c6a3','#d4b982','#bb8d51','#eef0e7'][this.state.season];ctx.globalAlpha=this.state.season===3?.72:.22;ctx.fillRect(0,0,m.w*16,m.h*16);ctx.globalAlpha=1;
    // Tree shade is baked into the ground; no animated shadow layers are required.
    for(const tree of m.objects.filter(o=>o.kind==='tree'&&!o.resource)){
      ctx.fillStyle='rgba(39,62,53,.12)';ctx.beginPath();ctx.ellipse((tree.x+.5)*16+9,(tree.y+1)*16+5,19,9,-.3,0,Math.PI*2);ctx.fill();
    }
  }
  private paintInterior(ctx:CanvasRenderingContext2D,m:WorldMap) {
    ctx.imageSmoothingEnabled=false;ctx.fillStyle=m.theme==='cave'?'#202c32':'#20272b';ctx.fillRect(0,0,m.w*16,m.h*16);
    for(let y=0;y<m.h;y++)for(let x=0;x<m.w;x++){
      if(m.tiles[y][x]==='floor'){
        if(m.theme==='cave'){
          const r=hash(x,y,9),tones=m.id==='ember-vault'?['#605347','#5c5045','#63574a']:m.id==='sky-vault'?['#56616b','#505d66','#5b646c']:['#4b6065','#455a60','#506469'];
          ctx.fillStyle=tones[Math.floor(r*3)];ctx.fillRect(x*16,y*16,16,16);ctx.fillStyle='#283d4145';ctx.fillRect(x*16,y*16,16,1);ctx.fillRect(x*16+(y%2?0:8),y*16,1,16);
          if(r<.15){ctx.fillStyle='#a7b2a242';ctx.fillRect(x*16+3,y*16+5,3,1);ctx.fillRect(x*16+10,y*16+12,2,1);}
          if((x===15||x===17)&&y>8&&y<21){ctx.fillStyle='#bda57660';ctx.fillRect(x*16+7,y*16,1,16);}
        }else this.assets.draw(ctx,'room/floor',x*16+8,y*16+16);
      }
      else if(m.theme==='cave'&&m.tiles[y+1]?.[x]==='floor')this.assets.draw(ctx,'room/cave-wall',x*16+8,y*16+16);
    }
    if(m.theme==='room'){
      for(let x=4;x<20;x++){this.assets.draw(ctx,`room/wall-${x===4?0:x===19?2:1}`,x*16+8,5*16);this.assets.draw(ctx,`room/wall-${x===4?6:x===19?8:7}`,x*16+8,6*16);}
      for(let y=6;y<20;y++)for(const x of [3,20])this.assets.draw(ctx,`room/wall-${x===3?3:5}`,x*16+8,y*16+16);
      for(const x of [7,16]){ctx.fillStyle='#594d3d';ctx.fillRect(x*16,4*16+4,24,23);ctx.fillStyle='#b8d1ca';ctx.fillRect(x*16+2,4*16+6,20,18);ctx.fillStyle='#ecd5a2';ctx.fillRect(x*16+11,4*16+6,2,18);ctx.fillRect(x*16+2,4*16+14,20,2);ctx.fillStyle='rgba(244,211,149,.11)';ctx.beginPath();ctx.moveTo(x*16+2,6*16);ctx.lineTo(x*16+22,6*16);ctx.lineTo(x*16+52,13*16);ctx.lineTo(x*16+4,13*16);ctx.closePath();ctx.fill();}
    }
  }
  draw(dt:number) {
    const s=this.state,m=MAPS[s.player.area],ctx=this.ctx;this.time+=dt;if(this.walking)this.walkPhase+=dt*8*Math.max(.45,this.walkSpeed);
    this.actions.update(dt);
    if(this.groundKey!==`${s.player.area}-${s.season}`)this.makeGround();
    const targetX=Math.max(0,Math.min(m.w*16-this.canvas.width/this.scale,s.player.x*16-this.canvas.width/this.scale/2));
    const targetY=Math.max(0,Math.min(m.h*16-this.canvas.height/this.scale,s.player.y*16-this.canvas.height/this.scale*.56));
    const follow=1-Math.exp(-dt*8*this.cameraResponse);this.camera.x+=(targetX-this.camera.x)*follow;this.camera.y+=(targetY-this.camera.y)*follow;
    ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=m.interior?'#20272b':'#899d68';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);ctx.imageSmoothingEnabled=false;
    ctx.save();ctx.scale(this.scale,this.scale);ctx.translate(-Math.round(this.camera.x*this.scale)/this.scale,-Math.round(this.camera.y*this.scale)/this.scale);
    ctx.drawImage(this.ground!,0,0);
    this.water();
    if(s.player.area==='farm')this.plots();
    if(this.aim&&!this.toolAnimation){ctx.strokeStyle='rgba(255,231,175,.68)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(this.aim.x*16,this.aim.y*16+3,7.5,3.2,0,0,Math.PI*2);ctx.stroke();}
    const objects:Array<{y:number;draw:()=>void}>=m.objects.filter(o=>objectVisible(s,o)&&(o.x+.5)*16>this.camera.x-90&&(o.x+.5)*16<this.camera.x+this.canvas.width/this.scale+90&&(o.y+1)*16>this.camera.y-30&&(o.y+1)*16<this.camera.y+this.canvas.height/this.scale+100).map(o=>({y:o.y+1,draw:()=>this.object(o)}));
    for(const tuft of this.tufts)if(tuft.x>=this.camera.x-16&&tuft.x<=this.camera.x+this.canvas.width/this.scale+16&&tuft.y>=this.camera.y-16&&tuft.y<=this.camera.y+this.canvas.height/this.scale+16)objects.push({y:tuft.y/16,draw:()=>{
      const phase=Math.floor(this.time*1.6+tuft.phase)%4,size=hash(tuft.x,tuft.y,2)>.8?13:10;ctx.drawImage(this.grassFrames[phase],Math.round(tuft.x)-size/2,Math.round(tuft.y)-size,size,size);
    }});
    const action=this.toolAnimation;
    if(action?.object&&action.impacted&&action.elapsed/action.duration<.7)objects.push({y:action.object.y+1,draw:()=>{
      ctx.save();const shake=action.impacted?Math.sin(action.elapsed*70)*1.5:0;ctx.translate(Math.round(shake),0);this.object(action.object!);ctx.restore();
    }});
    if(s.player.area!=='mine')for(const o of m.objects)if(o.resource==='wood'&&!objectVisible(s,o))objects.push({y:o.y+1,draw:()=>this.stump((o.x+.5)*16,(o.y+1)*16)});
    for(const f of FENCES[s.player.area])objects.push({y:f.y2,draw:()=>this.fence(f)});
    for(const v of VILLAGERS.filter(v=>v.area===s.player.area))objects.push({y:v.y+1,draw:()=>{this.shadow((v.x+.5)*16,(v.y+1)*16,6);ctx.save();if(v.hue)ctx.filter=`hue-rotate(${v.hue}deg)`;this.assets.drawGrounded(ctx,`${v.sprite}/down/${Math.floor(this.time*2)%3}`, (v.x+.5)*16,(v.y+1)*16);ctx.restore();this.bubble((v.x+.5)*16,(v.y+1)*16-24,s.friendships[v.id].talked?'heart':'talk');}});
    animalPositions(s).forEach(({animal:a,x:baseX,y:baseY},i)=>{
      const x=(baseX+Math.sin(this.time*.6+i*2)*.35)*16,y=(baseY+Math.cos(this.time*.5+i)*.25)*16;
      objects.push({y:y/16,draw:()=>{this.shadow(x,y,5);const species=a.kind==='chicken'?'bird':a.kind==='pig'?'pig':'rabbit';this.assets.drawGrounded(ctx,`${species}/down/${Math.floor(this.time*3)%3}`,x,y);if(a.product)this.bubble(x,y-22,'product');}});
    });
    objects.push({y:s.player.y,draw:()=>this.player()});objects.sort((a,b)=>a.y-b.y).forEach(o=>o.draw());
    this.toolEffects();
    for(const ring of this.ripples){ring.age+=dt;const p=ring.age/ring.life;ctx.globalAlpha=(1-p)*.6;ctx.strokeStyle=ring.tool==='water'?'#d2ece1':'#e4caa0';ctx.lineWidth=.65;for(let i=0;i<2;i++){ctx.beginPath();ctx.ellipse(ring.x,ring.y,3+p*11+i*3,1+p*3+i*.8,0,0,Math.PI*2);ctx.stroke();}}ctx.globalAlpha=1;this.ripples=this.ripples.filter(r=>r.age<r.life);
    for(const bit of this.debris){bit.age+=dt;bit.x+=bit.vx*dt;bit.y+=bit.vy*dt;bit.vy+=70*dt;ctx.globalAlpha=Math.max(0,1-bit.age/bit.life);ctx.fillStyle=bit.color;ctx.fillRect(Math.round(bit.x),Math.round(bit.y),bit.size,bit.size);}ctx.globalAlpha=1;this.debris=this.debris.filter(p=>p.age<p.life);
    if(s.player.area==='farm'&&s.upgrades.scarecrow)this.scarecrow(27.2*16,17*16);
    if(s.player.area==='farm'&&s.upgrades.sprinkler){ctx.fillStyle='#777e78';ctx.fillRect(26*16+5,20*16-8,6,10);ctx.fillStyle='#d2c496';ctx.fillRect(26*16+2,20*16-9,12,3);}
    if(this.hover&&s.player.area==='farm') {
      const p=s.plots.find(p=>p.x===Math.floor(this.hover!.x)&&p.y===Math.floor(this.hover!.y));
      if(p){ctx.strokeStyle='#fff1c5';ctx.lineWidth=1;ctx.strokeRect(p.x*16+.5,p.y*16+.5,15,15);}
    }
    for(const p of this.particles){p.age+=dt;ctx.font='bold 7px sans-serif';ctx.textAlign='center';ctx.globalAlpha=Math.max(0,1-p.age/1.6);ctx.fillStyle='#244335';ctx.fillText(p.text,p.x+1,p.y-p.age*10+1);ctx.fillStyle=p.color;ctx.fillText(p.text,p.x,p.y-p.age*10);}ctx.globalAlpha=1;this.particles=this.particles.filter(p=>p.age<1.6);
    ctx.restore();this.atmosphere();if(this.arrivalFade>0){this.arrivalFade=Math.max(0,this.arrivalFade-dt*1.8);ctx.fillStyle=`rgba(20,30,35,${this.arrivalFade})`;ctx.fillRect(0,0,this.canvas.width,this.canvas.height);}
  }
  private shadow(x:number,y:number,r:number) {this.ctx.fillStyle='rgba(33,49,32,.26)';this.ctx.beginPath();this.ctx.ellipse(Math.round(x),Math.round(y)-1,r,2,0,0,Math.PI*2);this.ctx.fill();}
  private water() {
    const m=MAPS[this.state.player.area],ctx=this.ctx;
    const left=Math.max(0,Math.floor(this.camera.x/16)-1),right=Math.min(m.w,Math.ceil((this.camera.x+this.canvas.width/this.scale)/16)+1),top=Math.max(0,Math.floor(this.camera.y/16)-1),bottom=Math.min(m.h,Math.ceil((this.camera.y+this.canvas.height/this.scale)/16)+1);
    for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(m.tiles[y][x]==='water') {
      const r=hash(x,y);if(r<.33){const phase=Math.floor(this.time*2+x*.5+y*.2)%8;ctx.fillStyle=phase<4?'#88c5b5':'#72b5aa';ctx.fillRect(x*16+phase,y*16+5+Math.floor(r*20),5,1);}
      if(r>.975){ctx.fillStyle='#658e5a';ctx.fillRect(x*16+5,y*16+6,7,4);ctx.fillStyle='#e4d1ce';ctx.fillRect(x*16+7,y*16+5,3,2);}
    }
    if(m.id==='farm'){for(let x=34;x<40;x++){ctx.fillStyle='#a58759';ctx.fillRect(x*16,19*16,16,32);ctx.fillStyle='#b69b68';ctx.fillRect(x*16+1,19*16+1,14,30);ctx.fillStyle='#846d49';ctx.fillRect(x*16,19*16+4,16,1);ctx.fillRect(x*16,20*16+3,16,1);}ctx.fillStyle='#6e6548';ctx.fillRect(34*16,19*16-2,96,3);ctx.fillRect(34*16,21*16,96,3);}
  }
  private fence(f:FenceSegment) {
    const ctx=this.ctx,x=f.x1*16,y=f.y1*16,w=(f.x2-f.x1)*16,h=(f.y2-f.y1)*16;
    if(w){ctx.fillStyle='#c1a16a';ctx.fillRect(x,y-7,w,2);ctx.fillRect(x,y-2,w,2);}
    else{ctx.fillStyle='#927049';ctx.fillRect(x-1,y-6,3,h);ctx.fillStyle='#ceb078';ctx.fillRect(x,y-6,1,h);}
    const length=w||h;
    for(let i=0;i<=length;i+=16){const px=x+(w?i:0),py=y+(h?i:0);ctx.fillStyle='#826341';ctx.fillRect(px-1,py-8,3,9);ctx.fillStyle='#dfc48a';ctx.fillRect(px-1,py-9,3,1);}
  }
  private plots() {
    const ctx=this.ctx;
    for(const p of this.state.plots) {
      if(p.tilled){ctx.fillStyle=p.watered?'#8e7454':'#b18b59';ctx.fillRect(p.x*16,p.y*16,16,16);ctx.fillStyle=p.watered?'#776148':'#947348';for(let y=3;y<16;y+=5)ctx.fillRect(p.x*16+1,p.y*16+y,14,1);ctx.fillStyle=p.watered?'#a58a60':'#c49b67';ctx.fillRect(p.x*16+1,p.y*16+1,14,1);}
      if(p.crop) {const c=CROPS[p.crop],stage=Math.min(c.stages-1,Math.floor(p.growth/c.days*(c.stages-1)));const response=this.ripples.find(r=>r.tool==='water'&&Math.abs(r.x-(p.x+.5)*16)<9&&Math.abs(r.y-(p.y+.5)*16)<9),bend=response?Math.sin(response.age*18)*.055*Math.max(0,1-response.age):0;ctx.save();ctx.translate((p.x+.5)*16,(p.y+1)*16);ctx.transform(1,0,bend,1,0,0);this.assets.draw(ctx,`${c.sheet}/${stage}`,0,0);ctx.restore();if(p.growth>=c.days&&Math.floor(this.time*2+p.x)%5===0){ctx.fillStyle='#fae7a6';ctx.fillRect(p.x*16+12,p.y*16+1,1,3);ctx.fillRect(p.x*16+11,p.y*16+2,3,1);}if(p.watered&&Math.floor(this.time*3+p.x+p.y)%9===0){ctx.fillStyle='#d3ded8';ctx.fillRect(p.x*16+3,p.y*16+11,1,1);}}
      if(p.fertilizer){ctx.fillStyle='#e6b862';ctx.fillRect(p.x*16+2,p.y*16+13,2,2);}
    }
  }
  private object(o:WorldObject) {
    const ctx=this.ctx,x=(o.x+.5)*16,y=(o.y+1)*16;
    if(o.action?.startsWith('npc:')){const v=VILLAGERS.find(v=>v.id===o.action!.split(':')[1]);if(v){this.shadow(x,y,5);ctx.save();if(v.hue)ctx.filter=`hue-rotate(${v.hue}deg)`;this.assets.drawGrounded(ctx,`${v.sprite}/down/1`,x,y);ctx.restore();}return;}
    if(o.action?.startsWith('mechanism:')){const [,area,index]=o.action.split(':'),active=this.state.discoveries.includes(`${area}-switch-${index}`);ctx.fillStyle='#4e5a60';ctx.fillRect(x-5,y-6,11,7);ctx.fillStyle=active?'#dbc18b':'#9b8d72';ctx.fillRect(x-4,y-7,9,3);ctx.strokeStyle='#b99f70';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x+(active?4:-4),y-15);ctx.stroke();ctx.fillStyle=active?'#f0d697':'#ad795b';ctx.fillRect(x+(active?2:-6),y-17,5,4);return;}
    if(o.action?.startsWith('treasure:')){const area=o.action.split(':')[1],open=this.state.discoveries.includes(`${area}-chest`),ready=[0,1,2].every(i=>this.state.discoveries.includes(`${area}-switch-${i}`));ctx.fillStyle='#77553b';ctx.fillRect(x-8,y-9,17,10);ctx.fillStyle=open?'#292e2c':'#b89252';ctx.fillRect(x-7,y-(open?15:11),15,open?5:4);ctx.fillStyle='#d6b46e';ctx.fillRect(x-6,y-9,2,10);ctx.fillRect(x+4,y-9,2,10);ctx.fillStyle=ready?'#ead29a':'#606a67';for(let i=0;i<3;i++)ctx.fillRect(x-5+i*4,y-5,2,2);return;}
    if(o.kind==='exit') {this.waypost(x,y-5);return;}
    if(o.kind==='forage') {
      this.shadow(x,y,4);
      if(o.resource==='flower'){ctx.fillStyle='#578644';ctx.fillRect(x,y-6,1,6);ctx.fillStyle='#efdfaf';ctx.fillRect(x-3,y-8,7,3);ctx.fillRect(x-1,y-10,3,7);ctx.fillStyle='#d9b352';ctx.fillRect(x-1,y-8,3,3);}
      else if(o.resource==='berry'){this.assets.draw(ctx,'tree_30',x,y);ctx.fillStyle='#bf6b7d';for(const [dx,dy] of [[-5,-8],[0,-14],[6,-10]])ctx.fillRect(x+dx,y+dy,3,3);}
      else{ctx.fillStyle='#e3ccaa';ctx.fillRect(x-1,y-4,3,5);ctx.fillStyle='#ad7860';ctx.fillRect(x-5,y-7,11,4);ctx.fillStyle='#e6c4a3';ctx.fillRect(x-4,y-6,2,1);}
      return;
    }
    if(o.frame) {
      if(o.kind!=='tree')this.shadow(x,y,o.kind==='building'?20:7);
      const filter=ctx.filter;if(o.kind==='tree'&&this.state.season===2)ctx.filter='sepia(.45) saturate(.8)';if(o.kind==='tree'&&this.state.season===3)ctx.filter='saturate(.25) brightness(1.15)';
      const drew=this.assets.draw(ctx,o.frame,x,y);ctx.filter=filter;if(drew){if(o.resource==='ore'){ctx.fillStyle=this.state.mineFloor>=2?'#9bc1c0':'#db9c69';ctx.fillRect(x-3,y-7,3,3);ctx.fillRect(x+2,y-4,2,2);}return;}
    }
    if(o.action==='mail'){ctx.fillStyle='#735a44';ctx.fillRect(x-1,y-13,3,14);ctx.fillStyle='#647f74';ctx.fillRect(x-6,y-18,12,8);ctx.fillStyle='#ecdfbb';ctx.fillRect(x-4,y-16,8,2);ctx.fillStyle='#ce9b68';ctx.fillRect(x+5,y-21,2,5);}
    else if(o.action==='board'){ctx.fillStyle='#805f45';ctx.fillRect(x-9,y-20,18,16);ctx.fillRect(x-8,y-6,2,8);ctx.fillRect(x+6,y-6,2,8);ctx.fillStyle='#dcc8a2';ctx.fillRect(x-7,y-18,14,12);ctx.fillStyle='#f1e8cb';ctx.fillRect(x-5,y-16,5,7);ctx.fillRect(x+2,y-15,4,6);}
    else if(o.action==='shipping'){ctx.fillStyle='#906c42';ctx.fillRect(x-9,y-10,18,11);ctx.fillStyle='#bf985d';ctx.fillRect(x-8,y-9,16,7);ctx.fillStyle='#665841';ctx.fillRect(x-7,y-11,14,3);ctx.fillStyle='#e7d29b';ctx.fillRect(x-2,y-6,5,3);}
    else if(o.action==='craft'){ctx.fillStyle='#b18b59';ctx.fillRect(x-10,y-8,20,3);ctx.fillStyle='#70573b';ctx.fillRect(x-8,y-5,2,6);ctx.fillRect(x+6,y-5,2,6);ctx.fillStyle='#9da5a0';ctx.fillRect(x-5,y-12,9,3);}
    else if(o.action==='mine-down'){ctx.fillStyle='#2f4640';ctx.fillRect(x-7,y-6,14,8);ctx.fillStyle='#b2a17a';for(let i=0;i<4;i++)ctx.fillRect(x-5,y-5+i*3,10,1);}
    else if(o.action==='festival'){ctx.fillStyle='#e1cf9f';ctx.fillRect(x-7,y-12,14,12);ctx.fillStyle='#bb8664';ctx.fillRect(x-9,y-15,18,4);ctx.fillStyle='#798855';ctx.fillRect(x-4,y-8,8,6);}
    else if(o.action==='fish'){ctx.fillStyle='#b6986b';ctx.fillRect(x-6,y-2,12,3);ctx.fillStyle='#765b40';ctx.fillRect(x-5,y+1,2,4);ctx.fillRect(x+3,y+1,2,4);}
    else if(o.action==='upgrade')this.waypost(x,y);
  }
  private waypost(x:number,y:number) {
    const ctx=this.ctx;ctx.fillStyle='#735b3d';ctx.fillRect(x-1,y-3,2,10);ctx.fillStyle='#c4a46f';ctx.fillRect(x-6,y-8,13,5);ctx.fillRect(x+7,y-7,2,3);ctx.fillStyle='#8f714d';ctx.fillRect(x-5,y-5,10,1);
  }
  private bubble(x:number,y:number,type:string) {if(type==='heart')return;const ctx=this.ctx;ctx.fillStyle='#f5efd8';ctx.fillRect(x-4,y-6,9,8);ctx.fillRect(x-2,y+2,3,2);ctx.fillStyle='#a18351';if(type==='talk'){ctx.fillRect(x-1,y-4,2,3);ctx.fillRect(x-1,y,2,1);}else {ctx.fillStyle='#d4b365';ctx.fillRect(x-1,y-4,3,4);}}
  private player() {
    const s=this.state,x=s.player.x*16,y=s.player.y*16;this.shadow(x,y,5);
    const action=this.toolAnimation;
    const p=action?Math.min(1,action.elapsed/action.duration):0;
    const kind=action?.tool==='hoe'?'hoe':action?.tool==='water'?'water':action?.tool==='seed'?'shovel':'walk';
    const anim=action&&kind!=='walk'?Math.min(2,Math.floor(p*3)):this.walking?Math.floor(this.walkPhase)%3:1;
    this.ctx.save();this.ctx.translate(x,y);
    if(action&&['hand','axe','pickaxe','rod'].includes(action.tool))this.ctx.scale(1,1-Math.sin(p*Math.PI)*.09);
    this.ctx.filter=s.avatar?`hue-rotate(${s.avatar*65}deg)`:'none';this.assets.drawGrounded(this.ctx,`farmer/${kind}/${action?.direction||s.player.direction}/${anim}`,0,0);this.ctx.restore();
    if(action&&['axe','pickaxe','rod'].includes(action.tool))this.heldTool(action,x,y,p);
  }
  private heldTool(a:ToolAnimation,x:number,y:number,p:number) {
    const ctx=this.ctx,side=a.direction==='left'?-1:1;
    ctx.save();ctx.translate(Math.round(x+side*5),Math.round(y-9));
    const swing=p<.32?-.7-p*1.5:p<.63?-1.18+(p-.32)*6: .68-(p-.63)*1.8;
    ctx.rotate(side*swing);ctx.scale(side,1);
    ctx.fillStyle='#604832';ctx.fillRect(0,-14,3,17);ctx.fillStyle='#c59961';ctx.fillRect(1,-13,1,15);
    if(a.tool==='axe'){ctx.fillStyle='#4a5558';ctx.fillRect(0,-14,8,6);ctx.fillStyle='#c8d3cd';ctx.fillRect(3,-14,5,5);ctx.fillStyle='#eef0d8';ctx.fillRect(7,-13,1,4);}
    else if(a.tool==='pickaxe'){ctx.fillStyle='#4d5d62';ctx.fillRect(-5,-14,12,3);ctx.fillStyle='#c9d7d0';ctx.fillRect(-4,-14,10,1);ctx.fillRect(-6,-12,2,3);ctx.fillRect(6,-12,2,3);}
    else{ctx.fillStyle='#d8c396';ctx.fillRect(1,-25,1,13);ctx.strokeStyle='#eee6ce';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(2,-25);ctx.lineTo((a.target.x*16-x)*side, a.target.y*16-y+9);ctx.stroke();}
    ctx.restore();
  }
  private scatter(tool:Tool,target:{x:number;y:number}) {
    const colors=tool==='water'?['#bce4dc','#e2f0dd','#76bbb4']:tool==='axe'?['#bf9a64','#e0c38b','#819453']:tool==='pickaxe'?['#abb8b0','#dec89c','#6f7c76']:tool==='hand'?['#e3d399','#8eaa61','#c1bd88']:['#aa8558','#dac097','#735c42'];
    const count=tool==='water'?24:tool==='rod'?5:tool==='hoe'?14:10;
    if(['water','hoe','hand'].includes(tool))this.ripples.push({x:target.x*16,y:target.y*16,age:0,life:tool==='water'?1.65:.55,tool});
    for(let i=0;i<count;i++){const h=hash(i,Math.round(target.x*11),7),v=hash(i,Math.round(target.y*17),9);this.debris.push({x:target.x*16,y:target.y*16-3,vx:(h-.5)*35,vy:-18-v*25,age:0,life:.35+v*.4,color:colors[i%colors.length],size:i%3?1:2});}
  }
  private toolEffects() {
    const a=this.toolAnimation;if(!a)return;const ctx=this.ctx,p=a.elapsed/a.duration,x=a.target.x*16,y=a.target.y*16;
    if(a.tool==='water'&&p>.2&&p<.92){
      const sx=this.state.player.x*16+(a.direction==='left'?-8:8),sy=this.state.player.y*16-10;
      for(let stream=0;stream<3;stream++)for(let i=0;i<9;i++){const q=(p*2.8+i/9+stream*.07)%1;ctx.globalAlpha=.65+stream*.1;ctx.fillStyle=(i+stream)%3?'#a8d9db':'#e2f1e1';ctx.fillRect(Math.round(sx+(x-sx)*q+(stream-1)*q*3),Math.round(sy+(y-sy)*q-6*Math.sin(q*Math.PI)),1,2);}ctx.globalAlpha=1;
      ctx.strokeStyle='#b4d8c19a';ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(x,y-1,2+(p*12)%6,1+(p*6)%3,0,0,Math.PI*2);ctx.stroke();
    }
    if(a.tool==='seed'&&p>.22&&p<.7){const q=(p-.22)/.48;ctx.fillStyle='#e0c58c';for(let i=0;i<3;i++)ctx.fillRect(Math.round(this.state.player.x*16+(x-this.state.player.x*16)*q+(i-1)*2),Math.round(this.state.player.y*16-10+(y-this.state.player.y*16+10)*q-Math.sin(q*Math.PI)*9),1,2);}
    if(a.tool==='hand'&&p>.38){ctx.strokeStyle='#e9dca491';ctx.lineWidth=.6;ctx.beginPath();ctx.ellipse(x,y-2,2+p*8,1+p*3,0,0,Math.PI*2);ctx.stroke();}
  }
  private stump(x:number,y:number) {const ctx=this.ctx;ctx.fillStyle='#72583d';ctx.fillRect(x-4,y-5,9,5);ctx.fillStyle='#b59a67';ctx.fillRect(x-4,y-6,9,3);ctx.fillStyle='#d7c08a';ctx.fillRect(x-2,y-5,5,1);}
  private scarecrow(x:number,y:number) {const ctx=this.ctx;ctx.fillStyle='#805f43';ctx.fillRect(x-1,y-13,2,15);ctx.fillStyle='#b78a55';ctx.fillRect(x-8,y-11,16,3);ctx.fillStyle='#d4b878';ctx.fillRect(x-4,y-18,8,7);ctx.fillStyle='#9b8060';ctx.fillRect(x-6,y-19,12,2);}
  private atmosphere() {
    const s=this.state,ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;
    if(MAPS[s.player.area].interior){ctx.fillStyle=MAPS[s.player.area].theme==='cave'?'rgba(18,30,43,.12)':'rgba(114,78,44,.06)';ctx.fillRect(0,0,w,h);return;}
    if(s.player.area==='mine'){ctx.fillStyle='rgba(22,40,38,.12)';ctx.fillRect(0,0,w,h);}
    else if(s.time>=1080){const dark=Math.min(.58,(s.time-1080)/550);ctx.fillStyle=`rgba(26,40,61,${dark})`;ctx.fillRect(0,0,w,h);}
    if(s.weather==='rain'&&s.player.area!=='mine'){ctx.fillStyle='rgba(42,71,88,.09)';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(234,244,224,.45)';ctx.lineWidth=1;for(let i=0;i<65;i++){const x=(hash(i,5)*w+this.time*60)%w,y=(hash(i,11)*h+this.time*150)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-3,y+9);ctx.stroke();}}
    if(s.weather==='snow'&&s.player.area!=='mine'){ctx.fillStyle='#f8f8e9';for(let i=0;i<45;i++){const x=(hash(i,8)*w+Math.sin(this.time+i)*8+w)%w,y=(hash(i,9)*h+this.time*18)%h;ctx.fillRect(x,y,2,2);}}
    if(s.weather==='sunny'&&s.player.area!=='mine'){ctx.fillStyle='rgba(251,243,190,.35)';for(let i=0;i<9;i++){const x=(hash(i,1)*w+this.time*9)%w,y=(hash(i,4)*h+Math.sin(this.time*.7+i)*20+h)%h;ctx.fillRect(x,y,3,2);}}
  }
}

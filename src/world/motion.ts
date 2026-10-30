/** Proportional analog steering with frame-rate independent response and a quick stop. */
export class SmoothMotion {
  x=0;y=0;
  update(dx:number,dy:number,dt:number,running=false) {
    const length=Math.hypot(dx,dy),speed=running?5:3.7;
    const factor=length>1?1/length:1;
    const targetX=dx*factor*speed,targetY=dy*factor*speed;
    const response=1-Math.exp(-Math.max(0,dt)*(length?19:42));
    this.x+=(targetX-this.x)*response;this.y+=(targetY-this.y)*response;
    if(Math.abs(this.x)<.012)this.x=0;if(Math.abs(this.y)<.012)this.y=0;
    return {x:this.x,y:this.y};
  }
  reset() {this.x=0;this.y=0;}
}

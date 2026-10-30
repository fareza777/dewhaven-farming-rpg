export interface AtlasFrame {frame:{x:number;y:number;w:number;h:number};sourceSize:{w:number;h:number};spriteSourceSize:{x:number;y:number;w:number;h:number};}
interface Atlas { image:HTMLImageElement;frames:Record<string,AtlasFrame>; }
export class Assets {
  atlases:Record<string,Atlas>={};
  terrain:HTMLImageElement|null=null;
  async load(onProgress:(n:number)=>void) {
    let count=0;
    await Promise.all([...['actors','props','world','furnishings'].map(async name=>{
      const base=['world','furnishings'].includes(name)?'/assets/world':'/assets/pack';
      const response=await fetch(`${base}/${name}.json`);if(!response.ok)throw new Error(`Missing local ${name} sprite atlas. Run npm run assets.`);
      const data=await response.json();const image=new Image();image.src=`${base}/${name}.png`;await image.decode();
      this.atlases[name]={image,frames:data.frames};onProgress(++count/5);
    }), (async()=>{const image=new Image();image.src='/assets/world/terrain.png';await image.decode();this.terrain=image;onProgress(++count/5);})()]);
  }
  frame(name:string):{atlas:Atlas;frame:AtlasFrame}|null {for(const atlas of Object.values(this.atlases))if(atlas.frames[name])return {atlas,frame:atlas.frames[name]};return null;}
  drawGrounded(ctx:CanvasRenderingContext2D,name:string,x:number,groundY:number,scale=1) {
    const result=this.frame(name);if(!result)return false;
    const f=result.frame;
    // The atlas trims transparent margins. Position visible feet, not the original cell's bottom.
    const footY=name.startsWith('farmer/')?24:f.spriteSourceSize.y+f.spriteSourceSize.h;
    const bottomPadding=f.sourceSize.h-footY;
    return this.draw(ctx,name,x,groundY+bottomPadding*scale,scale);
  }
  draw(ctx:CanvasRenderingContext2D,name:string,x:number,y:number,scale=1,anchorX=.5,anchorY=1) {
    const result=this.frame(name);if(!result)return false;
    const {atlas,frame:f}=result;ctx.drawImage(atlas.image,f.frame.x,f.frame.y,f.frame.w,f.frame.h,Math.round(x-f.sourceSize.w*scale*anchorX+f.spriteSourceSize.x*scale),Math.round(y-f.sourceSize.h*scale*anchorY+f.spriteSourceSize.y*scale),f.frame.w*scale,f.frame.h*scale);
    return true;
  }
  imageURL(name:string,scale=4):string {
    const result=this.frame(name);if(!result)return '';
    const {atlas,frame:f}=result;const c=document.createElement('canvas');c.width=f.sourceSize.w*scale;c.height=f.sourceSize.h*scale;const ctx=c.getContext('2d')!;ctx.imageSmoothingEnabled=false;this.draw(ctx,name,c.width/2,c.height,scale);return c.toDataURL();
  }
}

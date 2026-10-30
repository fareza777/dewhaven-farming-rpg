import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Assets } from '../src/world/assets.ts';

test('actor feet touch the ground across trimmed idle and walking frames', () => {
  const assets = new Assets();
  let bottom = 0;
  const ctx = { drawImage: (...args: number[]) => { bottom = args[6] + args[8]; } } as unknown as CanvasRenderingContext2D;
  for (const name of ['actors', 'world']) {
    const folder = name === 'actors' ? 'pack' : 'world';
    const frames = JSON.parse(readFileSync(`public/assets/${folder}/${name}.json`, 'utf8')).frames;
    assets.atlases[name] = { image: null as unknown as HTMLImageElement, frames };
    for (const frame of Object.keys(frames).filter(id => /^(farmer\/walk|chara_\d+|pig|bird|rabbit|cat)\//.test(id))) {
      for (const scale of [1, 2, 3]) {
        assets.drawGrounded(ctx, frame, 80, 120, scale);
        assert.equal(bottom, 120, `${frame} at scale ${scale}: feet separated from ground`);
      }
    }
  }
});
test('water and hoe effects do not shift the farmer foot pivot',()=>{
  const frames=JSON.parse(readFileSync('public/assets/pack/actors.json','utf8')).frames;
  const assets=new Assets();assets.atlases.actors={image:null as unknown as HTMLImageElement,frames};
  let drawTop=0;
  const ctx={drawImage:(...args:number[])=>{drawTop=args[6];}} as unknown as CanvasRenderingContext2D;
  for(const name of Object.keys(frames).filter(id=>/^farmer\/(water|hoe|shovel)\//.test(id))){
    assets.drawGrounded(ctx,name,80,120,2);
    assert.equal(drawTop-frames[name].spriteSourceSize.y*2+24*2,120,name);
  }
});

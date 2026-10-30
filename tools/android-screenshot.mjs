import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile,unlink } from 'node:fs/promises';
import assert from 'node:assert/strict';
const run=promisify(execFile);
// Encode on the host; PNG compression inside a software-rendered emulator can stall QA.
export async function captureAndroid(adbPath,serial,path) {
 let raw,width,height,format,header,valid=false;
 for(let attempt=0;attempt<3;attempt++) {
  ({stdout:raw}=await run(adbPath,['-s',serial,'exec-out','screencap'],{encoding:'buffer',timeout:60000,maxBuffer:20*1024*1024}));
  width=raw.length>=12?raw.readUInt32LE(0):0;height=raw.length>=12?raw.readUInt32LE(4):0;format=raw.length>=12?raw.readUInt32LE(8):0;header=raw.length-width*height*4;
  valid=width>0&&height>0&&[1,2].includes(format)&&[12,16].includes(header);
  if(valid)break;
  await new Promise(resolve=>setTimeout(resolve,200));
 }
 if(!valid) {
  const {stdout:png}=await run(adbPath,['-s',serial,'exec-out','screencap','-p'],{encoding:'buffer',timeout:60000,maxBuffer:20*1024*1024});
  assert(png.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),`Unexpected native framebuffer: ${JSON.stringify({bytes:raw.length,width,height,format,header})}`);
  await writeFile(path,png);return;
 }
 const temp=path+'.rgba';await writeFile(temp,raw.subarray(header));
 try {await run('python',['-c','from PIL import Image; import sys; Image.frombuffer("RGBA", (int(sys.argv[2]), int(sys.argv[3])), open(sys.argv[1], "rb").read(), "raw", "RGBA", 0, 1).save(sys.argv[4], compress_level=3)',temp,String(width),String(height),path],{timeout:30000});}
 finally{await unlink(temp).catch(()=>{});}
}

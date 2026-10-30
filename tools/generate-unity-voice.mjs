import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const content = path.join(root, 'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Content');
const originals = path.join(root, 'art/voice/deepgram-v1');
const audio = path.join(root, 'unity/Dewhaven/Assets/Dewhaven/Resources/Dewhaven/Audio/Voice');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const voices = {
  narrator:'draco', letter:'athena', Aya:'cordelia', Basil:'jupiter', Cleo:'vesta', Elias:'orpheus',
  Ilan:'odysseus', Jun:'hermes', Marin:'janus', Mira:'cora', Orin:'zeus', Pavel:'mars', Rowan:'pluto',
  Sera:'helena', Tamsin:'minerva', Vesper:'orion',
};
const intro = [
  {art:'letter',title:'A key. A garden. A beginning.',text:'Your grandmother left you the homestead—and a key wrapped in a delivery ledger. Her note is brief: “The garden can feed more than one household. Start there.”'},
  {art:'valley',title:'The roads between us.',text:'Beyond Dewhaven, three towns still rely on roads the winter storms have damaged. Aya, the valley courier, brings you as far as the old bridge.'},
  {art:'homestead',title:'What she left growing.',text:"The farmhouse is standing. The beds need tending, the shipping crate needs a hinge, and a few of Grandmother's crops are ready to gather."},
  {art:'dawn',title:'Your first morning.',text:'At six, sunlight reaches the bedroom floor. Mira opens the seedhouse at eight. There is time to plant your first rows before walking into town.'},
];

export function sentences(text) {
  return text.trim().split(/(?<=[.!?][”’"']?)\s+/u).filter(Boolean);
}
export function normalizeWav(source) {
  const bytes=Buffer.from(source);
  if(bytes.length<44||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WAVE')throw new Error('The provider response is not WAV audio.');
  let position=12;
  while(position+8<=bytes.length) {
    const name=bytes.toString('ascii',position,position+4),length=bytes.readUInt32LE(position+4),remaining=bytes.length-position-8;
    // The observed Deepgram PCM stream uses this placeholder before its final length is known.
    if(name==='data'&&length===0x7fff0000&&bytes.readUInt32LE(4)===0x7fff0024) {
      bytes.writeUInt32LE(remaining,position+4);bytes.writeUInt32LE(bytes.length-8,4);break;
    }
    if(length>remaining)throw new Error('The WAV file is incomplete.');
    position+=8+length+(length%2);
  }
  if(bytes.readUInt32LE(4)!==bytes.length-8)throw new Error('The WAV length is inconsistent.');
  wavInfo(bytes);return bytes;
}
export function wavInfo(bytes) {
  if (bytes.length<44 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WAVE') throw new Error('The provider response is not WAV audio.');
  let position=12,format,data;
  while(position+8<=bytes.length) {
    const name=bytes.toString('ascii',position,position+4),length=bytes.readUInt32LE(position+4),start=position+8;
    if(start+length>bytes.length)throw new Error('The WAV file is incomplete.');
    if(name==='fmt '&&length>=16)format={codec:bytes.readUInt16LE(start),channels:bytes.readUInt16LE(start+2),rate:bytes.readUInt32LE(start+4),byteRate:bytes.readUInt32LE(start+8),bits:bytes.readUInt16LE(start+14)};
    if(name==='data')data=length;
    position=start+length+(length%2);
  }
  if(!format||format.codec!==1||format.channels!==1||format.rate!==24000||format.bits!==16||!data||!format.byteRate)throw new Error('Unexpected voice format or empty speech.');
  const seconds=data/format.byteRate;
  if(seconds<.15||seconds>90)throw new Error('Unexpected narration duration.');
  return {...format,seconds,bytes:bytes.length,sha256:hash(bytes)};
}
export async function prepareVoicePlan() {
  const {quests}=JSON.parse(await fs.readFile(path.join(content,'campaign.json'),'utf8'));
  const main=quests.filter(q=>q.main);
  if(main.length!==24)throw new Error('Expected 24 main chapters.');
  const entries=[];
  function add(key,text,speaker) {
    const model='aura-2-'+(voices[speaker]??voices.letter)+'-en';
    const segments=sentences(text).map(text=>{
      const id=hash(JSON.stringify({model,text,encoding:'linear16',sample_rate:24000,speed:1})).slice(0,24);
      return {id,text,path:'Dewhaven/Audio/Voice/'+id};
    });
    if(!segments.length||segments.map(s=>s.text).join(' ')!==text.trim())throw new Error('Narration segmentation changed the subtitle text.');
    entries.push({key,text,speaker,model,segments});
  }
  intro.forEach((p,i)=>add('intro-'+i,p.text,'narrator'));
  for(const q of main)for(const kind of ['objective','opening','completion'])add('quest-'+q.id+'-'+kind,q[kind],kind==='objective'?'narrator':q.giver.includes('letter')?'letter':q.giver);
  const unique=[...new Map(entries.flatMap(e=>e.segments.map(s=>[s.id,{...s,model:e.model}]))).values()];
  const manifest={version:1,provider:'Deepgram Aura-2',language:'en',entries};
  const plan={manifest,intro:{pages:intro.map((p,i)=>({...p,voiceKey:'intro-'+i}))},segments:unique,
    passageCount:entries.length,segmentCount:unique.length,characters:unique.reduce((n,s)=>n+s.text.length,0),sourceDigest:hash(JSON.stringify(entries))};
  await fs.mkdir(originals,{recursive:true});
  await fs.writeFile(path.join(originals,'script.json'),JSON.stringify(plan,null,2));
  return plan;
}

export async function generateVoiceBank({apiKey,limit=Infinity,onProgress=()=>{},publish=false}={}) {
  if(!apiKey)throw new Error('DEEPGRAM_API_KEY is required only in the generation session.');
  const plan=await prepareVoicePlan();const jobs=plan.segments.slice(0,limit);
  let completed=0,generated=0,cached=0,cursor=0,halt=null;
  const records=[];await fs.mkdir(path.join(originals,'raw'),{recursive:true});
  async function worker() {
    while(!halt) {
      const index=cursor++;if(index>=jobs.length)return;
      const job=jobs[index],file=path.join(originals,'raw',job.id+'.wav');
      try {
        let info;
        try {info=wavInfo(await fs.readFile(file));cached++;}
        catch {info=null;}
        if(!info) {
          let bytes;
          for(let attempt=0;attempt<3;attempt++) {
            const url=new URL('https://api.deepgram.com/v1/speak');
            for(const [key,value] of Object.entries({model:job.model,encoding:'linear16',container:'wav',sample_rate:24000,speed:1,tag:'dewhaven-vo-2-2'}))url.searchParams.set(key,value);
            const response=await fetch(url,{method:'POST',headers:{Authorization:'Token '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({text:job.text}),signal:AbortSignal.timeout(45000)});
            if(response.ok){bytes=normalizeWav(Buffer.from(await response.arrayBuffer()));break;}
            const detail=(await response.text()).replaceAll(apiKey,'[redacted]').slice(0,600);
            if(attempt<2&&(response.status===429||response.status>=500)){await new Promise(r=>setTimeout(r,(attempt+1)*2000));continue;}
            throw new Error('Deepgram HTTP '+response.status+': '+detail);
          }
          info=wavInfo(bytes);await fs.writeFile(file+'.part',bytes);await fs.rename(file+'.part',file);generated++;
        }
        records.push({id:job.id,model:job.model,...info});completed++;
        onProgress({completed,total:jobs.length,generated,cached,lastId:job.id});
      } catch(error) {halt=new Error(String(error.message).replaceAll(apiKey,'[redacted]'));}
    }
  }
  await Promise.all([worker(),worker()]);if(halt)throw halt;
  const result={provider:'Deepgram Aura-2',endpoint:'https://api.deepgram.com/v1/speak',sourceDigest:plan.sourceDigest,
    passages:plan.passageCount,segments:plan.segmentCount,processed:completed,generated,cached,characters:plan.characters,
    bytes:records.reduce((n,x)=>n+x.bytes,0),seconds:records.reduce((n,x)=>n+x.seconds,0),createdAt:new Date().toISOString(),files:records.sort((a,b)=>a.id.localeCompare(b.id))};
  await fs.writeFile(path.join(originals,'generation.json'),JSON.stringify(result,null,2));
  if(publish) {
    if(jobs.length!==plan.segmentCount||completed!==plan.segmentCount)throw new Error('Every voice segment must finish before publishing.');
    await fs.mkdir(audio,{recursive:true});
    for(const segment of plan.segments) {
      const bytes=await fs.readFile(path.join(originals,'raw',segment.id+'.wav'));wavInfo(bytes);
      await fs.writeFile(path.join(audio,segment.id+'.wav'),bytes);
    }
    await fs.writeFile(path.join(content,'intro.json'),JSON.stringify(plan.intro,null,2));
    await fs.writeFile(path.join(content,'voiceover.json'),JSON.stringify(plan.manifest,null,2));
    await fs.writeFile(path.join(root,'docs/unity/voiceover-generation.json'),JSON.stringify(result,null,2));
  }
  return result;
}

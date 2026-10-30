// Dedicated local Unity MCP transport. Never routes to the shared :8080 editor.
import fs from 'node:fs';
import path from 'node:path';
const endpoint = 'http://127.0.0.1:8094';
const root = path.resolve(import.meta.dirname, '..');
let session;
let seq = 0;
async function rpc(method, params = {}, notification = false) {
  const headers = { 'Content-Type':'application/json', Accept:'application/json, text/event-stream' };
  if (session) headers['Mcp-Session-Id'] = session;
  const response = await fetch(endpoint, {method:'POST',headers,body:JSON.stringify({jsonrpc:'2.0',...(!notification?{id:++seq}:{}),method,params}),signal:AbortSignal.timeout(180000)});
  session = response.headers.get('mcp-session-id') ?? session;
  if (response.status === 202 || response.status === 204) return null;
  const raw = await response.text();
  if (!response.ok) throw new Error(`MCP HTTP ${response.status}: ${raw.slice(0,1000)}`);
  const payloads = raw.startsWith('event:') || raw.startsWith('data:')
    ? raw.split('\n').filter(x => x.startsWith('data:')).map(x => JSON.parse(x.slice(5).trim()))
    : [JSON.parse(raw)];
  const answer = payloads.find(x => x.id === seq) ?? payloads.at(-1);
  if (answer?.error) throw new Error(JSON.stringify(answer.error));
  return answer?.result;
}
await rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'Dewhaven isolated workspace',version:'1.0'}});
await rpc('notifications/initialized',{},true);
const [command, file, output] = process.argv.slice(2);
let result;
if (command === 'list') result = await rpc('tools/list');
else {
  const request = JSON.parse(fs.readFileSync(path.resolve(root,file),'utf8'));
  result = await rpc('tools/call',request);
}
if (output) {
  const destination = path.resolve(root,output);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,JSON.stringify(result,null,2));
}
if (command === 'list') result = {tools:result.tools.map(x=>({name:x.name,description:x.description?.split('\n')[0]}))};
const clean = JSON.stringify(result.structuredContent ?? result, (key,value) => key==='data' && typeof value==='string' && value.length>4096 ? `[binary ${value.length} characters]` : value, 2);
console.log(clean.length>16000 ? clean.slice(0,16000)+'\n[output shortened; full result saved when an output path was supplied]' : clean);
if (result?.isError) process.exitCode=1;

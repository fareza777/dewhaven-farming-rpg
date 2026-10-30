const CACHE='dewhaven-v2';
const CORE=['/','/assets/brand/valley-v2.png','/assets/brand/icon.svg','/assets/pack/actors.json','/assets/pack/actors.png','/assets/pack/props.json','/assets/pack/props.png','/assets/world/world.json','/assets/world/world.png','/manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dewhaven-')&&key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  // These local files have identical content for every request header.
  // Preview servers can vary on Origin even though module and precache requests share a URL.
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(event.request,{ignoreVary:true});
    if(cached)return cached;
    try {
      const response=await fetch(event.request);
      if(response.ok){const copy=response.clone();event.waitUntil(cache.put(event.request,copy));}
      return response;
    } catch {return event.request.mode==='navigate'?(await cache.match('/'))||Response.error():Response.error();}
  }));
});

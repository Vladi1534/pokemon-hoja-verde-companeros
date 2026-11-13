const CACHE='kanto-personal-3.1.0';
const ROOT=new URL('./',self.location).href;
const ENTRY=new URL('play.html',ROOT).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(['personal-engine.js','model-engine.js'].map(f=>new URL(f,ROOT).href));
 // Pages hosts index.html; the online service hosts the same application at play.html.
 const base=await fetch(ROOT,{cache:'reload'});if(base.ok)await cache.put(ROOT,base);
 for(const name of ['index.html','play.html']){const url=new URL(name,ROOT);try{const r=await fetch(url,{cache:'reload'});if(r.ok&&(r.headers.get('content-type')||'').includes('text/html'))await cache.put(url,r);}catch{}}
 // Download the complete score once, so a first visit to the League also works offline.
 try{
  const url=new URL('audio/manifest.json',ROOT),r=await fetch(url,{cache:'reload'});
  if(r.ok){await cache.put(url,r.clone());const manifest=await r.json();
   const files=[...new Set([...Object.values(manifest.music),...Object.values(manifest.sfx)].map(a=>'audio/'+a.file))];
   const next=async()=>{for(let file;(file=files.shift());){const u=new URL(file,ROOT);try{const a=await fetch(u);if(a.ok)await cache.put(u,a);}catch{}}};
   await Promise.all(Array.from({length:4},next));
  }
 }catch{}
 try{const u=new URL('model-manifest.json',ROOT),r=await fetch(u);if(r.ok){await cache.put(u,r.clone());const manifest=await r.json(),files=[...manifest.assets.map(a=>a.file),...manifest.previewFiles||[]];const next=async()=>{for(let f;(f=files.shift());){try{const u=new URL(f,ROOT),r=await fetch(u);if(r.ok)await cache.put(u,r);}catch{}}};await Promise.all([next(),next()]);}}catch{}
 const u=new URL('world-assets.json',ROOT),r=await fetch(u);if(!r.ok)throw Error('world manifest');await cache.put(u,r.clone());const {files}=await r.json();const queue=[...files];const next=async()=>{for(let f;(f=queue.shift());){const url=new URL(f,ROOT),asset=await fetch(url);if(!asset.ok)throw Error('world asset '+f);await cache.put(url,asset);}};await Promise.all([next(),next(),next(),next()]);
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('kanto-personal-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/')||!url.href.startsWith(ROOT))return;
 if(!['document','script'].includes(event.request.destination)&&!url.pathname.includes('/audio/')&&!url.pathname.includes('/models/')&&!url.pathname.includes('/model-previews/')&&!url.pathname.endsWith('/model-manifest.json')&&!url.pathname.includes('/native-maps/')&&!url.pathname.includes('/environment/')&&!url.pathname.endsWith('/world-assets.json'))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const r=await fetch(event.request);if(r.ok)await cache.put(event.request,r.clone());return r;}catch{const stored=await cache.match(event.request,{ignoreSearch:true});if(stored)return stored;if(event.request.mode==='navigate'){const fallback=await cache.match(new URL('index.html',ROOT))||await cache.match(ENTRY)||await cache.match(ROOT);if(fallback)return fallback;}return Response.error();}})());
});

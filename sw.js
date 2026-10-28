const CACHE='kanto-personal-2.5.0';
const ROOT=new URL('./',self.location).href;
const ENTRY=new URL('play.html',ROOT).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll([new URL('personal-engine.js',ROOT).href]);
 // Pages hosts index.html; the online service hosts the same application at play.html.
 const base=await fetch(ROOT,{cache:'reload'});if(base.ok)await cache.put(ROOT,base);
 for(const name of ['index.html','play.html']){const url=new URL(name,ROOT);try{const r=await fetch(url,{cache:'reload'});if(r.ok&&(r.headers.get('content-type')||'').includes('text/html'))await cache.put(url,r);}catch{}}
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('kanto-personal-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/api/')||!url.href.startsWith(ROOT))return;
 if(!['document','script'].includes(event.request.destination))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const r=await fetch(event.request);if(r.ok)await cache.put(event.request,r.clone());return r;}catch{const stored=await cache.match(event.request,{ignoreSearch:true});if(stored)return stored;if(event.request.mode==='navigate'){const fallback=await cache.match(new URL('index.html',ROOT))||await cache.match(ENTRY)||await cache.match(ROOT);if(fallback)return fallback;}return Response.error();}})());
});

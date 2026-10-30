const CACHE = 'fnd-companion-v5';
const ASSETS = ['./', './index.html', './manifest.json', './privacy.html', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, {cache:'reload'}))))); });
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys();
    const hadOld = ks.some(k => k !== CACHE && k.startsWith('fnd-companion-'));
    await Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    // Open pages still show the old version: reload them once so the update appears now. localStorage is not affected.
    if (hadOld){
      const cs = await self.clients.matchAll({type:'window'});
      cs.forEach(c => { try { c.navigate(c.url); } catch(err){} });
    }
  })());
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  // Pages: try the network first (so updates arrive quickly), fall back to the saved copy when offline.
  if (e.request.mode === 'navigate'){
    e.respondWith(fetch(e.request).then(resp => {
      if (resp.ok){ const cp = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return resp;
    }).catch(() => caches.match(e.request, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))));
    return;
  }
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request).then(resp => {
    if (resp.ok){ const cp = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return resp;
  }).catch(() => caches.match('./index.html'))));
});

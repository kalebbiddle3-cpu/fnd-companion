const CACHE = 'fnd-companion-v3';
const ASSETS = ['./', './index.html', './manifest.json', './privacy.html', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, {ignoreSearch: true}).then(r => r || fetch(e.request).then(resp => {
    if (resp.ok && new URL(e.request.url).origin === location.origin) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return resp;
  }).catch(() => caches.match('./index.html'))));
});

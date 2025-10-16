
const CACHE_NAME = 'vereint-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/assets/js/nav.js',
  '/manifest.webmanifest'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      // Cache GET navigations and same-origin assets
      if (req.method === 'GET' && req.url.startsWith(self.location.origin)) {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, respClone));
      }
      return resp;
    }).catch(() => cached))
  );
});

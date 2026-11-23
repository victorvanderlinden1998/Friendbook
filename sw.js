// Zorgt dat Friendbook ook zonder internet werkt.
const CACHE = 'friendbook-v3';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'demo.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-512.png',
  'fonts/caveat.woff2', 'fonts/kaushan-script.woff2', 'fonts/patrick-hand.woff2'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Eerst het netwerk proberen (zodat updates meteen zichtbaar zijn), anders de bewaarde versie.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok && new URL(event.request.url).origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE).then(c => c.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});

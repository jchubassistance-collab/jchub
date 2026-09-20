const CACHE_NAME = 'jchub-v4';
const APP_SHELL = ['/', '/manifest.webmanifest', '/favicon-blue.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== 'GET'
    || requestUrl.origin !== self.location.origin
    || requestUrl.pathname.startsWith('/api/')
    || requestUrl.pathname.startsWith('/_next/')
  ) return;

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return new Response('Ressource temporairement indisponible.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }).catch(() => new Response('Ressource temporairement indisponible.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }))),
  );
});
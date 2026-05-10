const CACHE_VERSION = 'warehouse-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Never cache: API calls, hashed JS/CSS bundles (Vite output), chrome-extension
  if (
    url.includes('/api/') ||
    url.startsWith('chrome-extension') ||
    /\.(js|css)\?/.test(url) ||
    /index-[A-Za-z0-9]+\.(js|css)/.test(url)
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || Response.error()))
  );
});

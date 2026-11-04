const CACHE_NAME = 'sie-penganugerahan-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo-milad.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.svg'
];

// Install Event - Resiliently Cache Core Assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use individual caching so single failure does not fail the whole SW
      await Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[ServiceWorker] Asset cache notice for ${asset}:`, err);
          })
        )
      );
    })
  );
});

// Activate Event - Clean old caches & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Safe Fallback (never resolves to undefined)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip Firebase, Firestore, Google APIs, and Vite internal dev routes from SW caching
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('__vite_ping')
  ) {
    return;
  }

  // Only handle same-origin or known CDN assets
  if (!event.request.url.startsWith(self.location.origin) && !url.hostname.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (offline or poor mobile connection)
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigation request (e.g. opening app), fallback to cached /index.html or /
        if (event.request.mode === 'navigate') {
          const fallbackIndex = (await caches.match('/index.html')) || (await caches.match('/'));
          if (fallbackIndex) {
            return fallbackIndex;
          }
        }

        // Return valid offline response rather than undefined to prevent NetworkError crash
        return new Response('Aplikasi sedang offline atau memuat pembaruan.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' }),
        });
      })
  );
});

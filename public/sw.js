const CACHE_VERSION = 'v2';
const CACHE_NAME = `calc-honorarios-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Install event - Cache assets
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Take control immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
          })
        );
      }),
      self.clients.claim() // Take control of all clients immediately
    ])
  );
});

// Fetch event - Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external URLs (optional, but good practice)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network request is successful, clone it and update cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try to serve from cache
        return caches.match(event.request);
      })
  );
});

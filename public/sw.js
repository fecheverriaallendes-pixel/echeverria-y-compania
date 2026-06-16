const CACHE_NAME = 'cuaderno-mdf-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Prevent caching of any API requests, firebase, firesbase-auth, or firestore queries
  const url = event.request.url;
  if (
    url.includes('/api') || 
    url.includes('firestore.googleapis.com') || 
    url.includes('firebase') || 
    url.includes('securetoken.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com')
  ) {
    return; // Bypass completely
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid static responses
        if (
          response && 
          response.status === 200 && 
          response.type === 'basic' &&
          (url.endsWith('.png') || url.endsWith('.js') || url.endsWith('.css') || url.includes('fonts.googleapis'))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

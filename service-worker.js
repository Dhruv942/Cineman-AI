
const CACHE_NAME = 'what-to-watch-cache-v3'; // Incremented version for updates
const urlsToCache = [
  '/', // Alias for index.html
  '/index.html',
  // Add paths to your placeholder icons if you want them pre-cached.
  // e.g., '/icons/icon-192x192.png', '/icons/icon-512x512.png'
  // For now, we'll let the manifest trigger their download or cache them on first use.
];

// Install event: cache core assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to cache app shell during install:', error);
      })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: serve cached assets or fetch from network
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests or non-http/https requests
  if (event.request.method !== 'GET' || !requestUrl.protocol.startsWith('http')) {
    // Non-cacheable, let the network handle it.
    return;
  }

  // API calls to Gemini: Network only.
  if (requestUrl.hostname.includes('generativelanguage.googleapis.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // App shell resources (HTML files): Cache first, then network.
  if (event.request.mode === 'navigate' || urlsToCache.includes(requestUrl.pathname) || (requestUrl.origin === self.origin && requestUrl.pathname === '/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Not in cache, fetch from network and cache it.
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
        }).catch(error => {
            console.error('[Service Worker] Fetch error for app shell resource:', event.request.url, error);
            // Optional: For navigation requests, return a fallback offline page if one is cached.
            // if (event.request.mode === 'navigate') {
            //   return caches.match('/offline.html');
            // }
            throw error; // Re-throw to let the browser handle the error display.
        })
    );
    return;
  }

  // For other requests (e.g., CDNs for CSS, fonts, scripts from importmap):
  // Strategy: Network first, then cache. If network fails, try cache.
  // This ensures fresh assets from CDNs when online, with offline fallback.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the fetch is successful, cache the response.
        if (networkResponse && networkResponse.status === 200) {
          // Only cache 'basic' (same-origin) and 'cors' (CDN) responses.
          // Avoid caching 'opaque' responses as their status can't be verified.
          if (networkResponse.type === 'basic' || networkResponse.type === 'cors') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return networkResponse;
      })
      .catch(() => {
        // Network request failed (e.g., offline). Try to serve from cache.
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If not in cache and network failed, there's nothing SW can do.
          // The browser will show its default error for this resource.
          console.warn('[Service Worker] Network fetch failed and no cache match for:', event.request.url);
          // Return undefined to let the browser handle the failure for this sub-resource.
          // For a navigation request, this would mean the browser's offline page.
          return new Response('', {status: 404, statusText: 'Not Found'});
        });
      })
  );
});
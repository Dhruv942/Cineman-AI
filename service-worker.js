const CACHE_NAME = "what-to-watch-cache-v5"; // Incremented version for updates
// API key is passed in the request message, not hardcoded for security
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

const urlsToCache = [
  "/", // Alias for index.html
  "/index.html",
  // Add paths to your placeholder icons if you want them pre-cached.
  // e.g., '/icons/icon-192x192.png', '/icons/icon-512x512.png'
  // For now, we'll let the manifest trigger their download or cache them on first use.
];

// Handle messages from extension pages to proxy API calls
// Check if chrome API is available (extension context)
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request && request.type === "CALL_PERPLEXITY_API") {
    const { systemPrompt, userPrompt, maxTokens, apiKey } = request;
    
    if (!apiKey) {
      sendResponse({
        success: false,
        error: "API key not provided",
      });
      return true;
    }
    
    fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: maxTokens || 2000,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.text().then((text) => {
            throw new Error(
              `Perplexity API error: ${response.status} ${response.statusText} - ${text}`
            );
          });
        }
        return response.json();
      })
      .then((data) => {
        if (!data.choices || data.choices.length === 0) {
          throw new Error("No response from Perplexity API");
        }
        sendResponse({
          success: true,
          data: data.choices[0].message.content,
        });
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message || "Unknown error",
        });
      });
    
    // Return true to indicate we will send a response asynchronously
    return true;
  }
  });
}

// Install event: cache core assets
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching app shell");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error(
          "[Service Worker] Failed to cache app shell during install:",
          error
        );
      })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate");
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event: serve cached assets or fetch from network
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Handle Perplexity API calls (POST requests) - proxy through service worker to avoid CORS
  if (requestUrl.hostname.includes("api.perplexity.ai")) {
    event.respondWith(
      fetch(event.request.clone()).catch((error) => {
        console.error("[Service Worker] Perplexity API error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch from Perplexity API" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      })
    );
    return;
  }

  // Skip non-GET requests or non-http/https requests
  if (
    event.request.method !== "GET" ||
    !requestUrl.protocol.startsWith("http")
  ) {
    // Non-cacheable, let the network handle it.
    return;
  }

  // API calls to Gemini: Network only.
  if (requestUrl.hostname.includes("generativelanguage.googleapis.com")) {
    event.respondWith(fetch(event.request));
    return;
  }

  // App shell resources (HTML files): Network first, then cache (for offline support)
  // This ensures we always get the latest HTML with correct asset references
  if (
    event.request.mode === "navigate" ||
    urlsToCache.includes(requestUrl.pathname) ||
    (requestUrl.origin === self.origin && requestUrl.pathname === "/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Always fetch fresh HTML from network first
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error(
            "[Service Worker] Network fetch failed for HTML, trying cache:",
            event.request.url,
            error
          );
          // If network fails, try cache (for offline support)
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error; // Re-throw if cache also fails
          });
        })
    );
    return;
  }

  // For asset files (JS, CSS): Network first with cache fallback
  // Always try network first to get latest assets
  if (requestUrl.pathname.startsWith("/assets/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Cache successful responses
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response("", { status: 404, statusText: "Not Found" });
          });
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
          if (
            networkResponse.type === "basic" ||
            networkResponse.type === "cors"
          ) {
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
          console.warn(
            "[Service Worker] Network fetch failed and no cache match for:",
            event.request.url
          );
          // Return undefined to let the browser handle the failure for this sub-resource.
          // For a navigation request, this would mean the browser's offline page.
          return new Response("", { status: 404, statusText: "Not Found" });
        });
      })
  );
});

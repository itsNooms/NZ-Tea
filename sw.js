const CACHE_NAME = 'nz-tea-cache-v1';
const urlsToCache = [
  './index.html',
  './login.html',
  './dash.html',
  './inventory.html',
  './manage.html',
  './analysis.html',
  './checkout.html',
  './product.html'
];

// Install event - cache important files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache add failed:', err);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients
});

// Fetch event - network first, then cache fallback (only for GET requests)
self.addEventListener('fetch', event => {
  // Skip non-GET requests, API calls, and external resources
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Skip API calls and external URLs
  if (url.pathname.startsWith('/api/') || 
      url.hostname !== location.hostname ||
      url.pathname.includes('chrome-devtools')) {
    return;
  }
  
  // Skip manifest and .well-known requests
  if (url.pathname.includes('.well-known') || url.pathname === '/manifest.json') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses for HTML files
        if (response.status === 200 && 
            (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Only return cached response for HTML files
        if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname === '') {
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              // Fallback to index.html for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
              }
              return new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});
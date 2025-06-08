const CACHE_NAME = 'clipboard-share-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/web-app-manifest-192x192.png',
  '/web-app-manifest-512x512.png',
  '/favicon-96x96.png',
  '/apple-touch-icon.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim control of all clients
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.log('Fetch failed:', error);
        // You could return a custom offline page here
        throw error;
      })
  );
});

// Background sync for offline clipboard operations (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'clipboard-sync') {
    event.waitUntil(
      // Handle background sync logic here if needed
      console.log('Background sync triggered')
    );
  }
});

// Push notification handling (optional for future features)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New clipboard content available',
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/web-app-manifest-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/web-app-manifest-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Clipboard Share', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

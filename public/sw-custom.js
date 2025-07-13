// Service Worker for Offline Support and Background Sync

// This line is required for Workbox to work with injectManifest
self.__WB_MANIFEST;

const CACHE_NAME = 'agritracker-v1';
const API_CACHE_NAME = 'agritracker-api-v1';
const OFFLINE_URL = '/offline.html';
const CACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/farm-icon.svg',
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell and assets');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Network first, falling back to cache strategy for API calls
const networkFirst = async (request) => {
  try {
    const networkResponse = await fetch(request);
    
    // If we got a valid response, update the cache
    if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If network fails, try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
};

// Cache first, falling back to network for static assets
const cacheFirst = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // If we got a valid response, cache it
    if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If we're offline and it's a navigation request, return the offline page
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
};

// Handle fetch events
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle API requests with network first strategy
  if (url.pathname.startsWith('/api/') || 
      url.hostname.endsWith('.supabase.co')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // For all other requests, use cache first strategy
  event.respondWith(cacheFirst(request));
});

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    event.waitUntil(
      // This is a placeholder - the actual sync is handled by the SyncQueue class
      // which is called when the page loads or when the connection is restored
      self.registration.showNotification('Syncing data...')
    );
  }
});

// Handle push notifications (if needed in the future)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update available',
    icon: '/farm-icon.svg',
    badge: '/farm-icon.svg',
    data: {
      url: data.url || '/',
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'AgriTracker', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Service Worker for LEGO Catalog

const CACHE_NAME = 'lego-catalog-v1';
const STATIC_CACHE = 'lego-catalog-static-v1';
const DYNAMIC_CACHE = 'lego-catalog-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/css/styles.css',
  '/assets/js/config.js',
  '/assets/js/utils.js',
  '/assets/js/storage.js',
  '/assets/js/api.js',
  '/assets/js/data-loader.js',
  '/assets/js/ui-components.js',
  '/assets/js/search.js',
  '/assets/js/catalog.js',
  '/assets/js/collection.js',
  '/assets/js/analytics.js',
  '/assets/js/app.js'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static files:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

// Handle different types of requests
async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Static assets (CSS, JS, images)
  if (isStaticAsset(url)) {
    return handleStaticAsset(request);
  }
  
  // API requests
  if (isApiRequest(url)) {
    return handleApiRequest(request);
  }
  
  // Data files (CSV)
  if (isDataFile(url)) {
    return handleDataFile(request);
  }
  
  // HTML pages
  if (isHtmlRequest(request)) {
    return handleHtmlRequest(request);
  }
  
  // Default: try network first, then cache
  return networkFirst(request);
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/assets/') || 
         url.pathname.endsWith('.css') || 
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.gif') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.ico');
}

// Check if request is for API
function isApiRequest(url) {
  return url.hostname.includes('rebrickable.com') ||
         url.hostname.includes('cdn.rebrickable.com');
}

// Check if request is for data file
function isDataFile(url) {
  return url.pathname.endsWith('.csv') ||
         url.pathname.startsWith('/data/');
}

// Check if request is for HTML
function isHtmlRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// Handle static assets - cache first
async function handleStaticAsset(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to handle static asset:', error);
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle API requests - network first with cache fallback
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('API request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Handle data files - stale while revalidate
async function handleDataFile(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Data file request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Revalidate in background
      fetch(request).then(response => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, response);
          });
        }
      }).catch(() => {
        // Ignore background fetch errors
      });
      return cachedResponse;
    }
    throw error;
  }
}

// Handle HTML requests - cache first
async function handleHtmlRequest(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to handle HTML request:', error);
    return new Response('Page not available offline', { status: 404 });
  }
}

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// Cache first strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

// Message handling
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls);
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName);
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage({ type: 'CACHE_INFO', payload: info });
      });
      break;
  }
});

// Cache specific URLs
async function cacheUrls(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const responses = await Promise.all(
      urls.map(url => fetch(url).catch(() => null))
    );
    
    responses.forEach((response, index) => {
      if (response && response.ok) {
        cache.put(urls[index], response);
      }
    });
    
    console.log(`Cached ${urls.length} URLs`);
  } catch (error) {
    console.error('Failed to cache URLs:', error);
  }
}

// Clear specific cache
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName);
    console.log(`Cleared cache: ${cacheName}`);
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

// Get cache information
async function getCacheInfo() {
  try {
    const cacheNames = await caches.keys();
    const cacheInfo = {};
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      cacheInfo[cacheName] = {
        size: keys.length,
        urls: keys.map(request => request.url)
      };
    }
    
    return cacheInfo;
  } catch (error) {
    console.error('Failed to get cache info:', error);
    return {};
  }
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Perform background sync
async function doBackgroundSync() {
  try {
    // Sync collection data
    console.log('Performing background sync...');
    
    // This would sync with cloud storage or API
    // Implementation depends on specific requirements
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/icons/favicon-192x192.png',
      badge: '/assets/icons/favicon-192x192.png',
      tag: data.tag || 'lego-catalog',
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('Service Worker loaded');

// service-worker.js
const CACHE_NAME = 'lego-catalog-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/css/styles.css',
  '/assets/js/app.js',
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
  '/manifest.json',
  '/assets/icons/favicon-16x16.png',
  '/assets/icons/favicon-32x32.png',
  '/assets/icons/apple-touch-icon.png',
  '/assets/icons/android-chrome-192x192.png',
  '/assets/icons/android-chrome-512x512.png',
  '/assets/images/ogimage.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        // Кэшируем файлы по одному, чтобы избежать ошибок CORS
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Service Worker: Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker: Caching completed');
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к внешним API и ресурсам
  if (event.request.url.includes('rebrickable.com') || 
      event.request.url.includes('brickognize.com') ||
      event.request.url.includes('corsproxy') ||
      event.request.url.includes('cdn.tailwindcss.com') ||
      event.request.url.includes('unpkg.com') ||
      event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Возвращаем кэшированную версию, если есть
        if (response) {
          return response;
        }

        // Иначе делаем запрос к сети
        return fetch(event.request)
          .then((response) => {
            // Проверяем, что ответ валидный
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ для кэширования
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Если запрос к сети не удался, показываем офлайн страницу
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Обработка сообщений от основного потока
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Обработка push уведомлений (если понадобится в будущем)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/icons/android-chrome-192x192.png',
      badge: '/assets/icons/favicon-32x32.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Открыть приложение',
          icon: '/assets/icons/favicon-32x32.png'
        },
        {
          action: 'close',
          title: 'Закрыть',
          icon: '/assets/icons/favicon-32x32.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Периодическая синхронизация (если поддерживается)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации данных
      console.log('Background sync triggered')
    );
  }
});
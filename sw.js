// URBAN RICH ADMIN SERVICE WORKER WITH PUSH NOTIFICATION DISPATCH (V4)

const CACHE_NAME = 'urban-rich-admin-v4_force_update';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        'index.html',
        'styles.css',
        'admin.js',
        'config.js',
        'manifest.json',
        'images/logo.jpg'
      ]).catch(err => console.log('Admin SW install cache bypass:', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Purging stale admin cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// PUSH EVENT HANDLER (FIRES EVEN WHEN PWA APP IS CLOSED)
self.addEventListener('push', (event) => {
  let data = { title: 'NEW URBAN RICH ORDER!', body: 'New order received!', icon: '/images/logo.jpg' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch(e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body || 'New order received!',
    icon: data.icon || '/images/logo.jpg',
    badge: '/images/logo.jpg',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: '/orders.html' }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'NEW URBAN RICH ORDER!', options)
  );
});

// NOTIFICATION CLICK HANDLER (OPENS ADMIN ORDERS PAGE)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data ? event.notification.data.url : '/orders.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (let client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

const CACHE_NAME = 'pc-altos-crm-v0.9.0';
const APP_SHELL = [
  './',
  './index_crm.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put('./index_crm.html', copy));
          return response;
        })
        .catch(() => caches.match('./index_crm.html'))
    );
    return;
  }

  if (url.origin === self.location.origin || url.hostname === 'www.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }))
    );
  }
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'SHOW_NOTIFICATION') return;
  const {title, options} = event.data;
  event.waitUntil(self.registration.showNotification(title || 'PC de los Altos', options || {}));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './index_crm.html?view=notificaciones', self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(clients => {
      for (const client of clients) {
        if ('navigate' in client) client.navigate(target);
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(target) : undefined;
    })
  );
});

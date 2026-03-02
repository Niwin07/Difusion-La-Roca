// public/sw.js
const CACHE_NAME = 'la-roca-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// 1. Instalación: Cacheamos lo básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Archivos cacheados');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Activación: Limpiamos cachés viejas
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 3. Interceptamos peticiones (Estrategia: Network First, fallback Cache)
// Intentamos ir a internet primero (para que siempre vean lo nuevo), si no hay internet, usa caché.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida, la clonamos a la caché por si acaso
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // Si falla internet, buscamos en caché
        return caches.match(event.request);
      })
  );
});

// === 🔔 ESCUCHAR NOTIFICACIONES PUSH ===
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/logo192.png',
      badge: data.badge || '/logo192.png',
      vibrate: [100, 50, 100], // Hace que el celu vibre
      data: {
        url: data.url || '/'
      }
    };

    // Mostramos la notificación en el celu/PC
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// === 🖱️ CUANDO TOCAN LA NOTIFICACIÓN ===
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Cerramos el cartelito
  
  // Abrimos la app
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
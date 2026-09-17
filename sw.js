/* FARADAY ENERGY - Service Worker */
var VERSION = 'v7';
var CACHE_PRE = 'faraday-precache-' + VERSION;
var CACHE_RUNTIME = 'faraday-runtime-' + VERSION;
var CACHES = [CACHE_PRE, CACHE_RUNTIME];

var PRE_CACHE = [
  '/', '/index.html', '/admin.html', '/admin.webmanifest',
  '/en/index.html', '/en/quienes-somos.html', '/en/servicios.html', '/en/contacto.html',
  '/pages/quienes-somos.html', '/pages/servicios.html', '/pages/clientes.html',
  '/pages/casos-exito.html', '/pages/blog.html', '/pages/contacto.html', '/pages/gracias.html',
  '/pages/servicio-asesoramiento.html', '/pages/servicio-climatizacion.html',
  '/pages/servicio-energia-solar.html', '/pages/servicio-llave-en-mano.html',
  '/pages/servicio-mantenimiento.html', '/pages/servicio-obra-civil.html',
  '/pages/servicio-obras-electricas.html', '/pages/servicio-respaldo-energia.html',
  '/pages/servicio-seguridad-fisica.html', '/pages/servicio-tecnologia.html',
  '/css/tokens.css', '/css/base.css', '/css/layout.css', '/css/components.css', '/css/motion.css',
  '/js/main.js', '/js/reveal.js', '/js/nav.js', '/js/supabase-config.js', '/js/quote-wizard.js',
  '/js/analytics.js', '/js/sentry-init.js', '/js/push.js', '/js/admin.js', '/js/hero-lightning.js',
  '/assets/img/favicon.png', '/assets/img/icon-192.png', '/assets/img/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_PRE).then(function (c) {
      return Promise.all(PRE_CACHE.map(function (u) {
        return c.add(u).catch(function () { return null; });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (CACHES.indexOf(k) === -1) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('push', function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = {}; }
  var title = data.title || 'FARADAY ENERGY';
  var opts = {
    body: data.body || '',
    icon: data.icon || '/assets/img/icon-192.png',
    badge: data.badge || '/assets/img/icon-192.png',
    tag: data.tag || 'faraday',
    data: { url: data.url || '/admin.html' }
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var target = (e.notification.data && e.notification.data.url) || '/admin.html';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (var i = 0; i < list.length; i++) {
        var p;
        try { p = new URL(list[i].url).pathname; } catch (err) { continue; }
        if (p === target) return list[i].focus();
      }
      return self.clients.openWindow(target);
    })
  );
});

var CDN = 'https://cdn.jsdelivr.net';
var FONTS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];

function isCacheableAsset(url) {
  var ext = url.split('?')[0].split('.').pop().toLowerCase();
  return ['css', 'js', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'ico', 'woff', 'woff2', 'gif'].indexOf(ext) !== -1;
}

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;
  var sameOrigin = url.indexOf(self.location.origin) === 0;
  if (!sameOrigin && url.indexOf(CDN) !== 0 && FONTS.every(function (f) { return url.indexOf(f) !== 0; })) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_RUNTIME).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
    return;
  }

  if ((sameOrigin || url.indexOf(CDN) === 0 || FONTS.some(function (f) { return url.indexOf(f) === 0; })) && isCacheableAsset(url)) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        return cached || fetch(e.request).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_RUNTIME).then(function (c) { c.put(e.request, copy); });
          }
          return res;
        });
      })
    );
  }
});

/* FARADAY ENERGY - Sentry init: solo cargado si hay DSN configurado */
(function () {
  'use strict';
  if (!window.SENTRY_DSN || window.SENTRY_DSN.indexOf('https://') !== 0) return;
  var script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/8.2.0/bundle.min.js';
  script.onload = function () {
    if (window.Sentry) {
      window.Sentry.init({ dsn: window.SENTRY_DSN });
    }
  };
  document.head.appendChild(script);
})();

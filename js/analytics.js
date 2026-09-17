/* FARADAY ENERGY - Analytics ligero con Umami/Plausible
   Se activa solo si window.PL_CONFIG con siteId/domain real */

(function () {
  'use strict';
  if (!window.PL_CONFIG || !window.PL_CONFIG.domain || window.PL_CONFIG.domain === 'TU-DOMINO.IO') return;

  var script = document.createElement('script');
  script.src = 'https://plausible.io/js/script.js';
  script.dataset.domain = window.PL_CONFIG.domain;
  document.head.appendChild(script);
})();

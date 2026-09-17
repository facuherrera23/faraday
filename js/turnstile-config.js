/* FARADAY ENERGY - Cloudflare Turnstile config */
(function () {
  'use strict';
  window.TURNSTILE_CONFIG = {
    siteKey: 'TURNSTILE_SITE_KEY_AQUI',
    enabled: false
  };
  window.TURNSTILE_READY = function () {
    return window.TURNSTILE_CONFIG.enabled === true &&
      window.TURNSTILE_CONFIG.siteKey.indexOf('0x') !== -1;
  };
})();

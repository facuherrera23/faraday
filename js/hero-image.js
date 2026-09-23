/* FARADAY ENERGY - Hero image override (desde el panel admin)
   Si SUPABASE no esta configurado o no hay imagen subida, queda el default.
   El overlay oscuro se mantiene siempre para legibilidad del texto. */
(function () {
  'use strict';

  var media = document.querySelector('[data-hero-key]');
  if (!media) return;
  if (!window.SUPABASE_READY || !SUPABASE_READY()) return;

  var key = media.getAttribute('data-hero-key');
  if (!key) return;

  var GRAD = 'linear-gradient(180deg, rgba(17,17,16,0.55) 0%, rgba(17,17,16,0.85) 100%)';
  var c = window.SUPABASE_CONFIG;

  fetch(c.url + '/rest/v1/hero_images?select=image_url&key=eq.' + encodeURIComponent(key) + '&limit=1', {
    headers: { 'apikey': c.anonKey, 'Authorization': 'Bearer ' + c.anonKey }
  }).then(function (r) {
    if (!r.ok) return null;
    return r.json();
  }).then(function (rows) {
    if (!rows || !rows.length || !rows[0].image_url) return;
    media.style.background = GRAD + ', url("' + rows[0].image_url + '") center/cover no-repeat';
  }).catch(function () { /* sin backend: default */ });
})();

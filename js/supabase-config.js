(function () {
  'use strict';

  /*
   * FARADAY ENERGY - Supabase config
   *
   * ## ESTADO: ESPERANDO EL PROYECTO NUEVO ##
   * El proyecto anterior (uvkmmlmeumrownidhfqu) fue ELIMINADO de Supabase.
   * Cuando crees el nuevo proyecto:
   *   1. Proyecto > Settings > API
   *   2. Copia "Project URL" y pegala en SUPABASE_URL_AQUI (incluye el https://)
   *   3. Copia "anon public" y pegala en SUPABASE_ANON_KEY_AQUI (empieza con eyJ...)
   *   O MAS FACIL: corre  python _setup_backend.py "URL" "ANON_KEY"
   *   Guia completa paso a paso: PUBLICAR.md (raiz del repo)
   *
   * NUNCA pegues la service_role key aqui - esta pagina es publica.
   * Con estos placeholders el sitio funciona igual (form via email, admin en DEMO);
   * al rellenarlos se activa todo automaticamente.
   */

  window.SUPABASE_CONFIG = {
    url: 'SUPABASE_URL_AQUI',
    anonKey: 'SUPABASE_ANON_KEY_AQUI',
    table: 'contact_submissions',
    /*
     * Web Push (VAPID). La publica viaja al navegador; la PRIVADA vive SOLO
     * como secret de la Edge Function send-push en Supabase (VAPID_PRIVATE_KEY).
     * Rotadas 2026-09-19 (el par anterior fue expuesto por deploys sin .vercelignore).
     * Par completo + instrucciones en .pwa-signing/vapid-keys.txt (gitignored).
     * NO depende del proyecto Supabase: ya esta lista para el nuevo.
     */
    vapidPublicKey: 'BEzVRS3-OOtITZdElDEEtYq0aDkRMTvbdjOJXi2Vv850IUuK2PYR2EPhp9TTK-JoBoxW4oIcnaguNdt7zPBV_0k'
  };

  window.SUPABASE_READY = function () {
    var c = window.SUPABASE_CONFIG;
    return c.url.indexOf('https://') === 0 && c.anonKey.indexOf('eyJ') === 0;
  };
})();

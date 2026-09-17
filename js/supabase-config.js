(function () {
  'use strict';

  /*
   * FARADAY ENERGY - Supabase config
   *
   * Cuando crees el proyecto en https://supabase.com:
   *   1. Proyecto > Settings > API
   *   2. Copiá "Project URL" y pegalo en SUPABASE_URL
   *   3. Copiá "anon public" key y pegála en SUPABASE_ANON_KEY
   *
   * NUNCA pegues la service_role key aqui - esta pagina es publica.
   */

  window.SUPABASE_CONFIG = {
    url: 'https://uvkmmlmeumrownidhfqu.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2a21tbG1ldW1yb3duaWRoZnF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTAyMDcsImV4cCI6MjEwNDMyNjIwN30.Qs-KLjT_r-BInOUrTaEzzEY4Ge6nJ6bkxOM1CJu4eqk',
    table: 'contact_submissions',
    /*
     * Web Push (VAPID). La publica viaja al navegador; la PRIVADA vive SOLO
     * como secret de la Edge Function send-push en Supabase (VAPID_PRIVATE_KEY).
     * Generadas con: npx web-push generate-vapid-keys
     */
    vapidPublicKey: 'BIKsum_eQdwtSSyWtPrQeEZxT6UvRlVhc1S0Twdg426Y8D6fCU2fGjWOO__DlEaxCRu42o7lfFW0mmSQh6Flj64'
  };

  window.SUPABASE_READY = function () {
    var c = window.SUPABASE_CONFIG;
    return c.url !== 'TU_SUPABASE_URL' && c.anonKey !== 'TU_SUPABASE_ANON_KEY' && c.url.indexOf('https://') === 0;
  };
})();

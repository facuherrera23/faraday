/* FARADAY ENERGY - Web Push subscription del panel admin
   Se activa solo cuando el usuario logueado es super_admin y hay VAPID config */

(function () {
  'use strict';

  var pushScript = document.createElement('script');
  pushScript.src = 'js/push.js'; // opcional, load-bajo demanda
  pushScript.async = true;
  document.head.appendChild(pushScript);

  window.FaradayPush = {
    pushSupported: ('serviceWorker' in navigator) && ('PushManager' in window),

    init: function (vapidKey) {
      if (!vapidKey || vapidKey.indexOf('B') !== 0) return Promise.resolve(null);
      if (!this.pushSupported) return Promise.resolve(null);
      return navigator.serviceWorker.ready.then(function (reg) {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: new Uint8Array(vapidToUint8(vapidKey))
        });
      }).then(function (sub) {
        if (window.__db && window.__currentUser) {
          return window.__db.from('push_subscriptions').upsert({
            user_id: window.__currentUser,
            subscription: JSON.stringify(sub)
          }).then(function () { return sub; });
        }
        return sub;
      });
    },

    vapidToUint8: function (base64String) {
      var padding = '='.repeat((4 - base64String.length % 4) % 4);
      var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      var raw = atob(base64);
      var arr = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
      return arr;
    }
  };

  function vapidToUint8(s) { return window.FaradayPush.vapidToUint8(s); }
})();

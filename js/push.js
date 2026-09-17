/* FARADAY ENERGY - Web Push del panel admin */
(function () {
  'use strict';

  var VAPID = (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.vapidPublicKey) || '';

  function vapidToBytes(b64) {
    var padding = '='.repeat((4 - b64.length % 4) % 4);
    var base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    var raw = atob(base64);
    var arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  window.FaradayPush = {
    supported: ('serviceWorker' in navigator) && ('PushManager' in window) && ('Notification' in window) && !!VAPID,

    enable: function (db, userId) {
      if (!this.supported || !db || !userId) return Promise.resolve(false);
      return Notification.requestPermission().then(function (perm) {
        if (perm !== 'granted') return false;
        return navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription().then(function (existing) {
            return existing || reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: vapidToBytes(VAPID)
            });
          });
        }).then(function (sub) {
          return db.from('push_subscriptions').upsert({
            user_id: userId,
            endpoint: sub.endpoint,
            subscription: sub
          }, { onConflict: 'endpoint' }).then(function (r) {
            if (r && r.error) throw r.error;
            return true;
          });
        });
      }).catch(function () { return false; });
    },

    refresh: function (btn) {
      if (!btn) return;
      if (!this.supported) { btn.style.display = 'none'; return; }
      if (Notification.permission === 'denied') {
        btn.textContent = 'NOTIFICACIONES BLOQUEADAS';
        btn.dataset.state = 'denied';
        return;
      }
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription();
        }).then(function (sub) {
          btn.textContent = sub ? 'NOTIFICACIONES ON' : 'ACTIVAR NOTIFICACIONES';
          btn.dataset.state = sub ? 'on' : 'off';
        }).catch(function () {
          btn.textContent = 'ACTIVAR NOTIFICACIONES';
          btn.dataset.state = 'off';
        });
        return;
      }
      btn.textContent = 'ACTIVAR NOTIFICACIONES';
      btn.dataset.state = 'off';
    }
  };
})();
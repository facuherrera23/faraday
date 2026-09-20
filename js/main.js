/* ═══════════════════════════════════════════════════════
   FARADAY ENERGY — Main Boot
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Dynamic year */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () { });
    });
  }

  /* Hero entrance animation */
  requestAnimationFrame(function () {
    document.documentElement.classList.add('is-loaded');
    var heroEls = document.querySelectorAll('.hero-enter');
    for (var i = 0; i < heroEls.length; i++) {
      heroEls[i].classList.add('loaded');
    }
  });
})();

(function () {
  'use strict';

  var toggles = document.querySelectorAll('.faq-q');
  if (!toggles.length) return;

  function closePanels(except) {
    for (var i = 0; i < toggles.length; i++) {
      if (toggles[i] === except) continue;
      toggles[i].setAttribute('aria-expanded', 'false');
      var panel = document.getElementById(toggles[i].getAttribute('aria-controls'));
      if (panel) panel.classList.remove('is-open');
    }
  }

  for (var i = 0; i < toggles.length; i++) {
    toggles[i].addEventListener('click', function () {
      var isOpen = this.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        this.setAttribute('aria-expanded', 'false');
        var selfPanel = document.getElementById(this.getAttribute('aria-controls'));
        if (selfPanel) selfPanel.classList.remove('is-open');
        return;
      }
      closePanels(this);
      this.setAttribute('aria-expanded', 'true');
      var panel = document.getElementById(this.getAttribute('aria-controls'));
      if (panel) panel.classList.add('is-open');
    });
  }
})();

(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var IS_EN = /^en/i.test(document.documentElement.lang || '');
  var btn = form.querySelector('button[type="submit"]');
  var btnText = btn ? btn.textContent.trim() : (IS_EN ? 'SEND' : 'ENVIAR');
  var status = null;

  function ensureStatus() {
    if (status) return status;
    status = document.createElement('div');
    status.id = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'margin-top:1rem;padding:0.8rem 1rem;font-family:var(--font-mono);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.12em;border:1px solid;display:none';
    form.appendChild(status);
    return status;
  }

  function setStatus(text, ok) {
    var el = ensureStatus();
    el.textContent = text;
    el.style.display = 'block';
    el.style.borderColor = ok ? 'var(--gold)' : 'var(--gray-400)';
    el.style.color = ok ? 'var(--gold)' : 'var(--gray-200)';
  }

  var turnstileLoaded = false;
  function initTurnstile() {
    if (!window.TURNSTILE_READY || !window.TURNSTILE_READY() || turnstileLoaded) return;
    turnstileLoaded = true;
    var holder = document.createElement('div');
    holder.id = 'turnstile-holder';
    holder.className = 'cf-turnstile';
    holder.setAttribute('data-sitekey', window.TURNSTILE_CONFIG.siteKey);
    holder.setAttribute('data-theme', 'dark');
    holder.style.margin = '0.5rem 0';
    var submit = form.querySelector('button[type="submit"]');
    if (submit) form.insertBefore(holder, submit);
    var s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true;
    document.head.appendChild(s);
  }
  initTurnstile();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var phone = form.querySelector('[name="telefono"]');
    var phoneVal = phone ? phone.value.trim() : '';
    if (phoneVal) {
      var digits = phoneVal.replace(/[\s\-().]/g, '');
      if (/^\+/.test(digits)) digits = digits.replace(/^\+(54)?/, '');
      else if (/^54/.test(digits)) digits = digits.replace(/^54/, '');
      if (/^9/.test(digits)) digits = digits.slice(1);
      if (!/^\d{8,12}$/.test(digits)) {
        setStatus(IS_EN ? 'INVALID NUMBER. EXAMPLE: +54 9 387 5151179' : 'NUMERO INVALIDO. EJEMPLO: +54 9 387 5151179', false);
        if (phone) { phone.style.borderColor = 'var(--gold)'; phone.focus(); }
        return;
      }
    }
    var email = form.querySelector('[name="email"]');
    var emailVal = email ? email.value.trim() : '';
    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setStatus(IS_EN ? 'INVALID EMAIL. CHECK AND TRY AGAIN.' : 'EMAIL INVALIDO. REVISA E INTENTA DE NUEVO.', false);
      if (email) { email.style.borderColor = 'var(--gold)'; email.focus(); }
      return;
    }

    var honeypot = form.querySelector('[name="website"]');
    if (honeypot && honeypot.value) {
      setStatus(IS_EN ? 'MESSAGE SENT. THANKS FOR CONTACTING US.' : 'MENSAJE ENVIADO. GRACIAS POR CONTACTARNOS.', true);
      form.reset();
      return;
    }

    if (turnstileLoaded && window.turnstile) {
      var twig = form.querySelector('#turnstile-holder iframe');
      var token = window.turnstile.getResponse();
      if (!token) {
        setStatus(IS_EN ? 'COMPLETE THE CAPTCHA TO SEND.' : 'COMPLETA EL CAPTCHA PARA ENVIAR.', false);
        return;
      }
      window.__cfTurnstileToken = token;
    }

    setStatus(IS_EN ? 'SENDING...' : 'ENVIANDO...', true);
    if (btn) {
      btn.disabled = true;
      btn.textContent = IS_EN ? 'SENDING...' : 'ENVIANDO...';
      btn.style.opacity = '0.6';
    }

  var data = {
      nombre: (form.querySelector('[name="nombre"]') || {}).value || '',
      empresa: (form.querySelector('[name="empresa"]') || {}).value || '',
      telefono: (form.querySelector('[name="telefono"]') || {}).value || '',
      tipo_servicio: (form.querySelector('[name="tipo_servicio"]') || {}).value || '',
      email: emailVal,
      mensaje: (form.querySelector('[name="mensaje"]') || {}).value || ''
    };

    var done = false;
    var didSupabase = { ok: false };
    var didForm = { ok: false };

    function redirect() {
      window.location.href = IS_EN ? '../pages/gracias.html' : 'gracias.html';
    }

    function onAnySuccess() {
      done = true;
      redirect();
    }

    function supabaseInsert(cb) {
      if (!window.SUPABASE_READY || !SUPABASE_READY()) return cb();
      fetch(SUPABASE_CONFIG.url + '/rest/v1/' + SUPABASE_CONFIG.table, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_CONFIG.anonKey,
          'Authorization': 'Bearer ' + SUPABASE_CONFIG.anonKey,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(data)
      }).then(function (r) { cb(r.ok); }).catch(function () { cb(false); });
    }

    function formsubmitOk(r) {
      return r.text().then(function (t) {
        if (!r.ok) return false;
        try {
          var j = JSON.parse(t);
          if (j && (j.success === 'false' || j.success === false)) return false;
        } catch (e) { /* body no-JSON: respetar r.ok */ }
        return true;
      }).catch(function () { return r.ok; });
    }

    function formsubmitSend(cb) {
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent('faradayenergycfc@gmail.com'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.assign({}, data, {
          _subject: IS_EN ? 'New inquiry - FARADAY ENERGY website' : 'Nueva consulta - sitio web FARADAY ENERGY',
          _replyto: emailVal,
          _captcha: 'false'
        }))
      }).then(function (r) { formsubmitOk(r).then(cb); }).catch(function () { cb(false); });
    }

    function flushQueue() {
      var key = 'faraday_offline_submissions';
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return;
        var arr = JSON.parse(raw);
        if (!arr.length) return;
        var remaining = [];
        arr.forEach(function (item) {
          formsubmitSendRaw(item, function (ok) {
            if (!ok) remaining.push(item);
            if (item === arr[arr.length - 1]) {
              localStorage.setItem(key, JSON.stringify(remaining));
            }
          });
        });
        if (remaining.length === 0) localStorage.removeItem(key);
      } catch (e) { /* ignore */ }
    }

    function formsubmitSendRaw(payload, cb) {
      fetch('https://formsubmit.co/ajax/' + encodeURIComponent('faradayenergycfc@gmail.com'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { formsubmitOk(r).then(cb); }).catch(function () { cb(false); });
    }

    function queueOffline() {
      var key = 'faraday_offline_submissions';
      try {
        var arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push(Object.assign({}, data, {
          _subject: IS_EN ? 'New inquiry - FARADAY ENERGY website' : 'Nueva consulta - sitio web FARADAY ENERGY',
          _replyto: emailVal
        }));
        localStorage.setItem(key, JSON.stringify(arr));
      } catch (e) { /* noop */ }
    }

    window.addEventListener('online', flushQueue);
    flushQueue();

    supabaseInsert(function (supOk) {
      didSupabase.ok = supOk;
      formsubmitSend(function (formOk) {
        didForm.ok = formOk;
        if (supOk || formOk) {
          onAnySuccess();
        } else {
          queueOffline();
          setStatus(IS_EN ? 'SAVED LOCALLY. IT WILL BE SENT AUTOMATICALLY WHEN THE CONNECTION RETURNS.' : 'GUARDADO LOCAL. SE ENVIARA AUTOMATICAMENTE CUANDO VUELVA LA CONEXION.', true);
          if (btn) { btn.disabled = false; btn.textContent = btnText; btn.style.opacity = '1'; }
          form.reset();
        }
      });
    });
  });
})();
(function () {
  'use strict';
  var t = document.getElementById('totop');
  if (!t) return;
  var show = function () {
    var hot = window.scrollY > 400;
    t.style.opacity = hot ? '1' : '0';
    t.style.visibility = hot ? 'visible' : 'hidden';
    t.style.transform = hot ? 'translateY(0)' : 'translateY(10px)';
  };
  window.addEventListener('scroll', show, { passive: true });
  t.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  show();
})();

(function () {
  "use strict";
  function tryPush() {
    if (!window.FaradayPush || !window.FaradayPush.init) return;
    if (window.location.pathname.indexOf("admin") === -1) return;
    if (window.VAPID_PUBLIC_KEY) {
      window.FaradayPush.init(window.VAPID_PUBLIC_KEY).then(function (sub) {
        if (sub) console.log("[push] suscripcion ok");
      });
    }
  }
  document.addEventListener("DOMContentLoaded", tryPush);
})();
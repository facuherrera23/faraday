/* FARADAY ENERGY - Quote Wizard */
(function () {
  'use strict';

  var wiz = document.getElementById('wiz');
  if (!wiz) return;

  var LS_KEY = 'faraday_quote_draft';

  var SERVICES = [
    'ASESORAMIENTO ENERGETICO', 'OBRAS ELECTRICAS', 'MANTENIMIENTO PREVENTIVO',
    'ENERGIA SOLAR', 'RESPALDO DE ENERGIA', 'CLIMATIZACION CONFORT TERMICO',
    'OBRA CIVIL', 'SOLUCIONES LLAVE EN MANO', 'TECNOLOGIA INTEGRAL', 'SEGURIDAD FISICA'
  ];
  var SECTORS = ['INDUSTRIAL', 'COMERCIAL', 'RESIDENCIAL', 'INSTITUCIONAL', 'EMPRESA'];
  var URGENCIES = ['CRITICA (24hs)', 'ALTA (48hs)', 'NORMAL (5-7 dias)', 'NO URGENTE'];

  var IS_EN = /^en/i.test(document.documentElement.lang || '');

  var SVC_LABELS_EN = {
    'ASESORAMIENTO ENERGETICO': 'ENERGY ADVISORY',
    'OBRAS ELECTRICAS': 'ELECTRICAL WORKS',
    'MANTENIMIENTO PREVENTIVO': 'PREVENTIVE MAINTENANCE',
    'ENERGIA SOLAR': 'SOLAR ENERGY',
    'RESPALDO DE ENERGIA': 'POWER BACKUP',
    'CLIMATIZACION CONFORT TERMICO': 'HVAC & THERMAL COMFORT',
    'OBRA CIVIL': 'CIVIL WORKS',
    'SOLUCIONES LLAVE EN MANO': 'TURNKEY SOLUTIONS',
    'TECNOLOGIA INTEGRAL': 'INTEGRATED TECHNOLOGY',
    'SEGURIDAD FISICA': 'PHYSICAL SECURITY'
  };
  var SECTOR_LABELS_EN = {
    'INDUSTRIAL': 'INDUSTRIAL',
    'COMERCIAL': 'COMMERCIAL',
    'RESIDENCIAL': 'RESIDENTIAL',
    'INSTITUCIONAL': 'INSTITUTIONAL',
    'EMPRESA': 'COMPANY'
  };
  var URG_LABELS_EN = {
    'CRITICA (24hs)': 'CRITICAL (24H)',
    'ALTA (48hs)': 'HIGH (48H)',
    'NORMAL (5-7 dias)': 'NORMAL (5-7 DAYS)',
    'NO URGENTE': 'NOT URGENT'
  };

  function labelFor(item, key) {
    if (!IS_EN) return item;
    var map = key === 'service' ? SVC_LABELS_EN : (key === 'sector' ? SECTOR_LABELS_EN : URG_LABELS_EN);
    return map[item] || item;
  }

  var state = { service: null, sector: null, urgency: null };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderChips(container, items, key) {
    container.innerHTML = '';
    items.forEach(function (item) {
      var b = el('button', 'wiz-chip btn-estado');
      b.type = 'button';
      b.textContent = labelFor(item, key);
      b.style.cssText = 'text-align:left;padding:0.6rem 0.9rem;font-size:0.6rem;border:1px solid var(--gray-500);background:var(--gray-700);color:var(--gray-200);cursor:pointer;letter-spacing:0.08em';
      if (state[key] === item) b.style.borderColor = 'var(--gold)';
      b.addEventListener('mouseenter', function () { if (state[key] !== item) b.style.borderColor = 'var(--gray-300)'; });
      b.addEventListener('mouseleave', function () { if (state[key] !== item) b.style.borderColor = 'var(--gray-500)'; });
      b.addEventListener('click', function () {
        state[key] = item;
        saveDraft();
        renderChips(container, items, key);
        render(); return;
      });
      container.appendChild(b);
    });
  }

  function goToStep(n) {
    ['wiz-step-1', 'wiz-step-2', 'wiz-step-3'].forEach(function (id, i) {
      document.getElementById(id).style.display = (i + 1 === n) ? 'block' : 'none';
      var btn = wiz.querySelector('[data-step="' + (i + 1) + '"]');
      if (btn) btn.classList.toggle('active', i + 1 === n);
    });
  }

  function render() {
    if (state.service == null) { goToStep(1); return; }
    if (state.sector == null) { goToStep(2); return; }
    if (state.urgency == null) { goToStep(3); return; }
    goToStep(3);
    var sum = document.getElementById('wiz-summary');
    if (!sum) return;
    sum.innerHTML =
      (IS_EN ? 'SERVICE: ' : 'SERVICIO: ') + '<strong style="color:var(--gold)">' + labelFor(state.service, 'service') + '</strong><br>' +
      (IS_EN ? 'SECTOR: ' : 'SECTOR: ') + '<strong>' + labelFor(state.sector, 'sector') + '</strong><br>' +
      (IS_EN ? 'URGENCY: ' : 'URGENCIA: ') + '<strong>' + labelFor(state.urgency, 'urgency') + '</strong>' +
      '<div style="margin-top:0.6rem;color:var(--gray-400);font-size:0.55rem">' + (IS_EN ? 'PRE-FILLED IN THE FORM BELOW' : 'CAJA PRE-COMPLETADA EN EL FORMULARIO DE ABAJO') + '</div>';
    sum.style.display = 'block';
    var go = document.getElementById('wiz-apply');
    if (go) go.style.display = 'inline-flex';
    var wa = document.getElementById('wiz-wa');
    if (wa) wa.style.display = 'inline-flex';
  }

  function draftMessage(withDetails) {
    var base = (IS_EN ? 'SERVICE: ' : 'SERVICIO: ') + labelFor(state.service, 'service') + '\n' +
      (IS_EN ? 'SECTOR: ' : 'SECTOR: ') + labelFor(state.sector, 'sector') + '\n' +
      (IS_EN ? 'URGENCY: ' : 'URGENCIA: ') + labelFor(state.urgency, 'urgency');
    if (!withDetails) return base;
    return base + '\n\n' +
      (IS_EN ? 'Project details:\n[Write your project details here.]' : 'Detalle del proyecto:\n[Escriba aqui detalles de su proyecto]');
  }

  function waMessage() {
    return (IS_EN ? 'Hi FARADAY ENERGY, I would like a quote.\n' : 'Hola FARADAY ENERGY, quisiera una cotizacion.\n') +
      draftMessage(false);
  }

  function saveDraft() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function loadDraft() {
    try {
      var raw = JSON.parse(localStorage.getItem(LS_KEY));
      if (raw && raw.service) Object.assign(state, raw);
    } catch (e) {}
  }

  function applyToForm() {
    var frm = document.getElementById('contact-form');
    if (!frm) return;
    var msg = frm.querySelector('[name="mensaje"]');
    if (msg) {
      msg.value = draftMessage(true);
      msg.dispatchEvent(new Event('input', { bubbles: true }));
    }
    var sel = frm.querySelector('[name="tipo_servicio"]');
    if (sel) {
      var opts = Array.from(sel.options); var opt = opts.find(function (o) { return o.value === state.service; }) || opts.find(function (o) { return o.value.indexOf((state.service || '').split(' ')[0]) !== -1; });
      if (opt) sel.value = opt.value;
    }
    if (frm.scrollIntoView) frm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var badge = document.getElementById('form-status');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'form-status';
      badge.setAttribute('role', 'status');
      badge.setAttribute('aria-live', 'polite');
      badge.style.cssText = 'margin-top:1rem;padding:0.8rem 1rem;font-family:var(--font-mono);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.12em;border:1px solid;display:none';
      if (frm.appendChild) frm.appendChild(badge);
    }
    badge.textContent = IS_EN ? 'READY - CHECK THE FORM AND SEND.' : 'LISTO - REVISA EL FORMULARIO Y ENVIAR.';
    badge.style.borderColor = 'var(--gold)';
    badge.style.color = 'var(--gold)';
    badge.style.display = 'block';
  }

  /* init */
  loadDraft();
  goToStepVac(1);
  renderChips(document.getElementById('wiz-svc'), SERVICES, 'service');
  renderChips(document.getElementById('wiz-sector'), SECTORS, 'sector');
  renderChips(document.getElementById('wiz-urg'), URGENCIES, 'urgency');
  if (state.service) render();

  function goToStepVac(n) {
    var steps = ['wiz-step-1', 'wiz-step-2', 'wiz-step-3'];
    for (var i = 0; i < 3; i++) {
      var el = document.getElementById(steps[i]);
      if (el) el.style.display = i + 1 === n ? 'block' : 'none';
    }
    var tabs = wiz.querySelectorAll('[data-step]');
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].classList.toggle('active', parseInt(tabs[j].dataset.step, 10) === n);
    }
  }

  var applyBtn = document.getElementById('wiz-apply');
  if (applyBtn) applyBtn.addEventListener('click', function (e) {
    e.preventDefault();
    applyToForm();
  });

  var waBtn = document.getElementById('wiz-wa');
  if (waBtn) waBtn.addEventListener('click', function (e) {
    e.preventDefault();
    window.open('https://wa.me/5493875151179?text=' + encodeURIComponent(waMessage()), '_blank', 'noopener');
  });

  /* Tab buttons (data-step) navigate freely */
  wiz.querySelectorAll('[data-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var n = parseInt(btn.dataset.step, 10);
      goToStep(n);
    });
  });
})();

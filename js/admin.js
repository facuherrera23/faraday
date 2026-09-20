/*
 * FARADAY ENERGY - Admin Panel
 * Demo mode: activa cuando js/supabase-config.js no tiene credenciales reales.
 * En cuanto pegues SUPABASE_URL y SUPABASE_ANON_KEY el panel pasa a leer/escribir en la base real.
 */
(function () {
  'use strict';

  var DEMO = !(window.SUPABASE_CONFIG && window.SUPABASE_READY && SUPABASE_READY()) || /[?&]demo=1/.test(location.search);
  var db = null;
  if (!DEMO) {
    if (typeof supabase === 'undefined') {
      document.getElementById('login-error').textContent = 'ERROR: Supabase JS no cargo. Revisa la conexion.';
      return;
    }
    db = supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
  }

  var currentRole = null;
  var currentUserEmail = null;
  var currentUserId = null;
  var leadsCache = [];
  var teamCache = [];
  var currentFilter = '';
  var searchInput = '';

  var DEMO_TESTIMONIOS = [
    { id: 't1', nombre: 'Carlos Medina', empresa: 'Casino MAC Plaza', texto: 'Son profesionales de punta a punta. Nos cambiaron la linea completa de iluminacion y bajamos el consumo en 3 meses.', aprobado: true, created_at: '2026-09-01T10:00:00Z' },
    { id: 't2', nombre: 'Empresa Perifar', empresa: 'Perifar SRL', texto: 'El mejor servicio electrico de Salta. Responden en menos de un dia y resuelven. Recomendado 100%.', aprobado: true, created_at: '2026-08-20T10:00:00Z' },
    { id: 't3', nombre: 'Jorge Palma', empresa: 'Aeropuerto Termas Rio Hondo', texto: 'Obras electricas impecables. Cumplieron plazos perfectos.', aprobado: false, created_at: '2026-09-10T10:00:00Z' }
  ];
  var serviceFilter = '';
  var SLA_WARN_MS = 24 * 3600 * 1000;

  function slaBadge(lead) {
    var ms = Date.now() - new Date(lead.created_at).getTime();
    var hrs = Math.floor(ms / 3600000);
    var txt = hrs < 1 ? 'nueva' : (hrs < 24 ? hrs + 'h' : (Math.floor(hrs / 24) + 'd'));
    var color = ms > SLA_WARN_MS ? '#c0392b' : 'var(--gold)';
    return '<span style="font-family:var(--font-mono);font-size:0.5rem;color:' + color + ';border-left:2px solid ' + color + ';padding-left:0.35rem;margin-left:0.4rem;letter-spacing:0.08em" title="' + hrs + 'h sin responder">' + txt + '</span>';
  }

  var els = {
    loginView: document.getElementById('view-login'),
    pendingView: document.getElementById('view-pending'),
    mainView: document.getElementById('view-main'),
    loginError: document.getElementById('login-error'),
    overlay: document.getElementById('detail-overlay')
  };

  function $(id) { return document.getElementById(id); }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }); }
    catch (e) { return iso; }
  }

  function fmtDay(iso) {
    try { return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }); }
    catch (e) { return iso; }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ================= DEMO DATA ================= */
  var DEMO_LEADS = [
    { id: 'd1', nombre: 'Roberto Soria', empresa: 'Hotel Termal Spa', email: 'rob@termas.com', telefono: '3874 55-1234', tipo_servicio: 'ENERGIA SOLAR', mensaje: 'Tengo un hotel en Termas de Rio Hondo y quiero un estudio de paneles solares para la piscina cubierta.', estado: 'nuevo', created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: 'd2', nombre: 'Ana Gutierrez', empresa: 'Taller Central', email: 'ana@tallercentral.com.ar', telefono: '', tipo_servicio: 'OBRAS ELECTRICAS', mensaje: 'Necesito reformar el cableado del taller y agregar una linea trifasica para una presa nueva.', estado: 'nuevo', created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: 'd3', nombre: 'Carlos Medina', empresa: 'Hacienda La Florida', email: 'contacto@hacienda.com', telefono: '3874 66-7788', tipo_servicio: 'CLIMATIZACION CONFORT TERMICO', mensaje: 'Consideramos una climatizacion integral para la casona. Necesito una visita tecnica esta semana por favor.', estado: 'contactado', created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString() },
    { id: 'd4', nombre: 'Lucia Paz', empresa: '', email: 'lucia.paz@gmail.com', telefono: '', tipo_servicio: 'OTRA CONSULTA', mensaje: 'Hola! Tengo una consulta general sobre mantenimiento preventivo para mi local.', estado: 'cerrado', created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
    { id: 'd5', nombre: 'Mario Escudero', empresa: 'Frigorifico del Norte', email: 'mario@frigo.com', telefono: '3874 52-0011', tipo_servicio: 'RESPALDO DE ENERGIA', mensaje: 'Quiero un grupo electrogeno de reserva para las cámaras frigorificas. Cuento con planilla de consumos.', estado: 'leido', created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() }
  ];

  var DEMO_USERS = [
    { user_id: 'u1', email: 'noelia@faradayenergy.com', nombre: 'Noelia Boutenet (Vos)', rol: 'super_admin' },
    // react-doctor-disable-next-line react-doctor/supabase-client-owned-authz-field -- demo data, nunca se escribe a Supabase; cambios de rol via RPC update_user_role
    { user_id: 'u2', email: 'raul@faradayenergy.com', nombre: 'Raul Tecnico', rol: 'admin' },
    { user_id: 'u3', email: 'nuevo@empleado.com', nombre: '', rol: 'pending' },
    { user_id: 'u4', email: 'otro@empleado.com', nombre: '', rol: 'pending' }
  ];

  /* ================= VIEW ================= */
  function showView(name) {
    els.loginView.style.display = name === 'login' ? 'flex' : 'none';
    els.pendingView.style.display = name === 'pending' ? 'flex' : 'none';
    els.mainView.classList.toggle('visible', name === 'main');
    els.mainView.style.display = name === 'main' ? 'block' : 'none';
  }

  function bootMain(role, email, uid) {
    currentRole = role;
    currentUserEmail = email;
    currentUserId = uid;
    showView('main');
    setupPush();
    $('current-user').textContent = (email || '').split('@')[0].toUpperCase() + ' (' + role + ')';
    $('tab-equipo').style.display = role === 'super_admin' ? 'block' : 'none';
    applyFilter();
    subscribeRealtime();
  }

  /* ================= PUSH NOTIFICATIONS ================= */
  function setupPush() {
    var btn = document.getElementById('btn-push');
    var api = window.FaradayPush;
    if (!btn || DEMO || !api || !api.supported) {
      if (btn) btn.style.display = 'none';
      return;
    }
    btn.style.display = '';
    api.refresh(btn);
    btn.onclick = function () {
      if (btn.dataset.state === 'denied') return;
      btn.textContent = 'ACTIVANDO...';
      api.enable(db, currentUserId).then(function () { api.refresh(btn); });
    };
  }

  function hidePush() {
    var btn = document.getElementById('btn-push');
    if (btn) btn.style.display = 'none';
  }

  /* ================= DATA LOAD ================= */
  function loadLeads() {
    if (DEMO) {
      leadsCache = DEMO_LEADS.slice();
      applyFilter();
      return;
    }
    db.from('contact_submissions').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) {
        $('leads-list').innerHTML = '<p style="padding:2rem;text-align:center;color:var(--blue);font-family:var(--font-mono);font-size:0.65rem">ERROR: ' + esc(r.error.message) + '</p>';
        return;
      }
      leadsCache = r.data || [];
      applyFilter();
    });
  }

  function getLeadColor(estado) {
    if (estado === 'nuevo') return 'var(--gold)';
    if (estado === 'leido') return 'var(--blue)';
    if (estado === 'contactado') return 'var(--gray-300)';
    return 'var(--gray-400)';
  }

  function leadPassesFilters(lead) {
    if (currentFilter && lead.estado !== currentFilter) return false;
    if (serviceFilter && lead.tipo_servicio !== serviceFilter) return false;
    if (searchInput) {
      var haystack = (lead.nombre + ' ' + (lead.empresa || '') + ' ' + (lead.email || '') + ' ' + (lead.tipo_servicio || '') + ' ' + (lead.mensaje || '')).toLowerCase();
      if (haystack.indexOf(searchInput.toLowerCase()) === -1) return false;
    }
    return true;
  }

  function applyFilter() {
    var visible = leadsCache.filter(leadPassesFilters);
    var today = new Date().toDateString();
    var nuevas = leadsCache.filter(function (l) { return l.estado === 'nuevo'; }).length;
    var hoy = leadsCache.filter(function (l) { return new Date(l.created_at).toDateString() === today; }).length;
    var cont = function (st) { return leadsCache.filter(function (l) { return l.estado === st; }).length; };

    $('stat-total').textContent = leadsCache.length;
    $('stat-nuevos').textContent = nuevas;
    $('stat-hoy').textContent = hoy;
    $('stat-leidos').textContent = cont('leido');
    $('stat-contactados').textContent = cont('contactado');
    $('stat-cerrados').textContent = cont('cerrado');
    $('badge-leads').textContent = leadsCache.length;

    var list = $('leads-list');
    list.innerHTML = '';
    if (!visible.length) {
      list.innerHTML = '<p style="padding:2.5rem;text-align:center;font-family:var(--font-mono);font-size:0.65rem;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.1em">Sin resultados en esta vista</p>';
      return;
    }
    visible.forEach(function (lead) { list.appendChild(buildLeadItem(lead)); });
  }

  function buildLeadItem(lead) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'lead-item';
    el.innerHTML =
      '<span class="lead-dot" style="background:' + getLeadColor(lead.estado) + '"></span>' +
      '<span class="lead-main">' +
        '<span class="lead-name">' + esc(lead.nombre) + slaBadge(lead) + '</span>' +
        '<span class="lead-meta">' + esc(lead.email || '') + (lead.empresa ? ' · ' + esc(lead.empresa) : '') + '</span>' +
      '</span>' +
      '<span class="lead-side">' +
        '<span class="lead-svc">' + esc(lead.tipo_servicio || 'OTRA CONSULTA') + '</span>' +
        '<span class="lead-date">' + fmtDate(lead.created_at) + '</span>' +
      '</span>';
    el.addEventListener('click', function () { openDetail(lead); });
    return el;
  }

  /* ================= DETAIL ================= */
  function openDetail(lead) {
    $('d-nombre').textContent = lead.nombre || '';
    $('d-empresa').textContent = lead.empresa || '—';
    var emailEl = $('d-email');
    emailEl.textContent = lead.email || '';
    emailEl.href = lead.email ? 'mailto:' + lead.email : '#';
    $('d-telefono').textContent = lead.telefono || '—';
    $('d-servicio').textContent = lead.tipo_servicio || '';
    $('d-fecha').textContent = fmtDate(lead.created_at);
    $('d-mensaje').textContent = lead.mensaje || '';

    var box = $('d-estados');
    box.innerHTML = '';

    ['nuevo', 'leido', 'contactado', 'cerrado'].forEach(function (st) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn-estado' + (lead.estado === st ? ' active' : '');
      b.textContent = st.toUpperCase();
      b.addEventListener('click', function () { setEstado(lead, st); });
      box.appendChild(b);
    });

    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:0.5rem;flex-wrap:wrap;width:100%;margin-top:0.5rem';

    if (lead.telefono) {
      actions.appendChild(makeContactBtn('LLAMAR', 'tel:' + lead.telefono));
      var wa = (lead.telefono || '').replace(/[^0-9]/g, '');
      if (wa.indexOf('549') !== 0) wa = '549' + wa;
      var msg = encodeURIComponent('Hola ' + lead.nombre + ', soy de FARADAY ENERGY. Recibi tu consulta sobre ' + (lead.tipo_servicio || '') + ' y queria contactarte.');
      actions.appendChild(makeContactBtn('WHATSAPP', 'https://wa.me/' + wa + '?text=' + msg, true));
    }
    if (lead.email) {
      var subject = encodeURIComponent('Re: Tu consulta en FARADAY ENERGY');
      var body = encodeURIComponent('Hola ' + lead.nombre + ',\n\nGracias por tu consulta sobre ' + (lead.tipo_servicio || '') + '.\n\n---\nTu mensaje:\n' + lead.mensaje + '\n---\n\nSaludos,\nFARADAY ENERGY');
      actions.appendChild(makeContactBtn('EMAIL', 'mailto:' + lead.email + '?subject=' + subject + '&body=' + body));
    }

    var pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.className = 'btn btn--ghost';
    pdfBtn.style.cssText = 'padding:0.5rem 0.9rem;font-size:0.6rem;display:inline-flex;align-items:center;gap:0.4rem;border-color:var(--gold);color:var(--gold)';
    pdfBtn.textContent = 'COTIZACION PDF';
    pdfBtn.addEventListener('click', function () { printQuotePDF(lead); });
    actions.appendChild(pdfBtn);
    box.appendChild(actions);

    els.overlay.classList.add('visible');
  }

  function printQuotePDF(lead) {
    var fecha = fmtDate(lead.created_at);
    var body =
      '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Cotizacion</title><style>' +
      'body{font-family:Arial,sans-serif;margin:0;padding:2rem;color:#111;font-size:12px;line-height:1.6}' +
      '.wm{color:#c8951a;}' +
      'h1{font-size:1.4rem;margin:0 0 0.2rem;text-transform:uppercase;letter-spacing:0.05em}' +
      '.sub{font-size:0.65rem;color:#666;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:2rem}' +
      'hr{border:none;border-top:2px solid #c8951a;margin:1rem 0 1.5rem}' +
      '.row{display:flex;justify-content:space-between;gap:1rem;padding:0.4rem 0;border-bottom:1px solid #ddd}' +
      '.k{font-size:0.6rem;text-transform:uppercase;letter-spacing:0.1em;color:#666}' +
      '.v{text-align:right;max-width:60%}' +
      '.box{border:1px solid #ccc;padding:0.9rem 1rem;margin-top:1rem;font-style:italic;color:#222;page-break-inside:avoid}' +
      '.foot{margin-top:2rem;padding-top:1rem;border-top:1px solid #ddd;font-size:0.6rem;color:#666}' +
      '</style></head><body>' +
      '<h1>COTIZACION</h1>' +
      '<div class="sub">FARADAY ENERGY S.R.L. · Salta, Argentina</div>' +
      '<hr>' +
      '<div class="row"><span class="k">CLIENTE</span><span class="v">' + leadsCacheEsc(lead.nombre || '') + '</span></div>' +
      (lead.empresa ? '<div class="row"><span class="k">EMPRESA</span><span class="v">' + leadsCacheEsc(lead.empresa) + '</span></div>' : '') +
      '<div class="row"><span class="k">EMAIL</span><span class="v">' + leadsCacheEsc(lead.email || '') + '</span></div>' +
      (lead.telefono ? '<div class="row"><span class="k">TELEFONO</span><span class="v">' + leadsCacheEsc(lead.telefono) + '</span></div>' : '') +
      '<div class="row"><span class="k">SERVICIO</span><span class="v">' + leadsCacheEsc(lead.tipo_servicio || 'OTRA CONSULTA') + '</span></div>' +
      '<div class="row"><span class="k">FECHA</span><span class="v">' + leadsCacheEsc(fecha) + '</span></div>' +
      '<div class="box"><strong>Mensaje del cliente:</strong><br>' + leadsCacheEsc(lead.mensaje || '').replace(/\n/g, '<br>') + '</div>' +
      '<div class="foot">Solicitud de cotizacion generada internamente por FARADAY ENERGY desde el panel admin web (' + document.title + ').</div>' +
      '</body></html>';

    var w = window.open('', '_blank');
    if (!w) return;
    w.document.write(body);
    w.document.close();
    w.focus();
    setTimeout(function () { try { w.print(); } catch (e) {} }, 500);
  }

  function leadsCacheEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function makeContactBtn(label, href, isExternal) {
    var a = document.createElement('a');
    a.className = 'btn btn--ghost';
    a.style.cssText = 'padding:0.5rem 0.9rem;font-size:0.6rem;display:inline-flex;align-items:center;gap:0.4rem';
    a.href = href;
    if (isExternal) { a.target = '_blank'; a.rel = 'noopener'; }
    a.textContent = label;
    return a;
  }

  function setEstado(lead, st) {
    lead.estado = st;
    if (!DEMO) {
      db.from('contact_submissions').update({ estado: st }).eq('id', lead.id).then(function (r) {
        if (r.error) {
          console.error('update error', r.error);
          return;
        }
      });
    }
    openDetail(lead);
    applyFilter();
  }

  function closeDetail() { els.overlay.classList.remove('visible'); }

  /* ================= TEAM ================= */
  function loadTeam() {
    if (DEMO) {
      teamCache = DEMO_USERS.map(function (u) {
        return { user_id: u.user_id, email: u.email, nombre: u.nombre, role: u.rol };
      });
      renderTeam();
      return;
    }
    db.from('admin_profiles').select('*').then(function (r) {
      if (r.error) return;
      teamCache = r.data || [];
      renderTeam();
    });
  }

  function renderTeam() {
    var list = $('members-list');
    list.innerHTML = '';
    teamCache.forEach(function (m) {
      var row = document.createElement('div');
      row.className = 'member-row';
      var left = document.createElement('div');
      left.innerHTML =
        '<div style="font-family:var(--font-mono);font-size:0.7rem;color:var(--white)">' + esc(m.nombre || m.email) + '</div>' +
        '<div style="font-family:var(--font-mono);font-size:0.55rem;color:var(--gray-400);margin-top:0.15rem">' + esc(m.email) + '</div>';
      row.appendChild(left);

      var right = document.createElement('div');
      right.style.cssText = 'display:flex;align-items:center;gap:0.5rem';

      var sel = document.createElement('select');
      sel.className = 'member-select';
      [['pending', 'PENDIENTE'], ['admin', 'ADMIN'], ['super_admin', 'SUPER ADMIN']].forEach(function (pair) {
        var o = document.createElement('option');
        o.value = pair[0]; o.textContent = pair[1];
        if (m.role === pair[0]) o.selected = true;
        sel.appendChild(o);
      });
      if (m.user_id === currentUserId) sel.disabled = true;
      sel.addEventListener('change', function () { changeRole(m.user_id, sel.value); });
      right.appendChild(sel);
      row.appendChild(right);
      list.appendChild(row);
    });
    $('badge-equipo').textContent = teamCache.filter(function (m) { return m.role === 'pending'; }).length;
  }

  function changeRole(uid, role) {

    if (DEMO) {
      teamCache = teamCache.map(function (m) { return m.user_id === uid ? Object.assign({}, m, { role: role }) : m; });
      renderTeam();
      return;
    }
    db.rpc('update_user_role', { target_user: uid, new_role: role }).then(function () { loadTeam(); });
  }

  var testCache = [];

  function loadTestimonios() {
    if (DEMO) {
      testCache = DEMO_TESTIMONIOS.slice();
      renderTestimonios();
      return;
    }
    db.from('testimonios').select('*').order('created_at', { ascending: false }).then(function (r) {
      if (r.error) { setListMsg('testimonios-list', 'ERROR: ' + r.error.message); return; }
      testCache = r.data || [];
      renderTestimonios();
    });
  }

  function setListMsg(id, txt) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = '<p style="padding:2rem;text-align:center;font-family:var(--font-mono);font-size:0.65rem;color:var(--gray-400);text-transform:uppercase;letter-spacing:0.1em">' + txt + '</p>';
  }

  function renderTestimonios() {
    var list = document.getElementById('testimonios-list');
    if (!list) return;
    list.innerHTML = '';
    if (!testCache.length) {
      setListMsg('testimonios-list', 'NO HAY TESTIMONIOS TODAVIA. AGREGALO ARRIBA.');
      return;
    }
    testCache.forEach(function (t) {
      var row = document.createElement('div');
      row.className = 'lead-item';
      row.style.cssText = 'display:grid;grid-template-columns:auto 1fr auto auto;gap:0.8rem;align-items:center';
      var dotCol = t.aprobado ? 'var(--gold)' : 'var(--gray-500)';
      row.innerHTML =
        '<span class="lead-dot" style="background:' + dotCol + '"></span>' +
        '<span class="lead-main">' +
          '<span class="lead-name">' + esc(t.nombre) + (t.empresa ? ' · ' + esc(t.empresa) : '') + '</span>' +
          '<span class="lead-meta">' + esc((t.texto || '').slice(0, 70)) + (t.texto && t.texto.length > 70 ? '...' : '') + '</span>' +
        '</span>' +
        '<span>' +
          '<button type="button" class="btn-estado t-toggle" style="margin-right:0.4rem">' + (t.aprobado ? 'DESAPROBAR' : 'APROBAR') + '</button>' +
          '<button type="button" class="btn-estado t-del" style="border-color:var(--gray-600);color:var(--gray-400)">BORRAR</button>' +
        '</span>' +
        '<span class="lead-date">' + fmtDate(t.created_at) + '</span>';
      row.querySelector('.t-toggle').addEventListener('click', function () {
        if (DEMO) { t.aprobado = !t.aprobado; renderTestimonios(); syncPublicTestimonios(); return; }
        db.from('testimonios').update({ aprobado: !t.aprobado }).eq('id', t.id).then(function () { loadTestimonios(); });
      });
      row.querySelector('.t-del').addEventListener('click', function () {
        if (!confirm('Borrar el testimonio de ' + t.nombre + '?')) return;
        if (DEMO) {
          testCache = testCache.filter(function (x) { return x.id !== t.id; });
          renderTestimonios();
          syncPublicTestimonios();
          return;
        }
        db.from('testimonios').delete().eq('id', t.id).then(function () { loadTestimonios(); });
      });
      list.appendChild(row);
    });
    var badge = document.getElementById('badge-testimonios');
    if (badge) badge.textContent = testCache.filter(function (t) { return !t.aprobado; }).length;
  }

  function syncPublicTestimonios() {
    try {
      var pub = testCache.filter(function (t) { return t.aprobado; });
      localStorage.setItem('faraday_public_testimonios', JSON.stringify(pub));
    } catch (e) {}
  }

  var addBtn = document.getElementById('testimonio-add-btn');
  if (addBtn) addBtn.addEventListener('click', function () {
    var nombre = (document.getElementById('t-nombre') || {}).value || '';
    var empresa = (document.getElementById('t-empresa') || {}).value || '';
    var texto = (document.getElementById('t-texto') || {}).value || '';
    if (!nombre.trim() || !texto.trim()) { alert('NOMBRE y TEXTO son obligatorios'); return; }
    var nuevo = { nombre: nombre.trim(), empresa: empresa.trim(), texto: texto.trim(), aprobado: false, created_at: new Date().toISOString() };
    if (DEMO) {
      nuevo.id = 'demo-' + Date.now();
      testCache.unshift(nuevo);
      ['t-nombre', 't-empresa', 't-texto'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      renderTestimonios();
      return;
    }
    db.from('testimonios').insert(nuevo).then(function (r) {
      if (r.error) { alert('ERROR: ' + r.error.message); return; }
      ['t-nombre', 't-empresa', 't-texto'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
      loadTestimonios();
    });
  });

  /* ================= SEARCH / FILTER / CSV ================= */

  $('search-input').addEventListener('input', function () {
    searchInput = this.value.trim();
    applyFilter();
  });

  document.querySelectorAll('[data-filter]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('[data-filter]').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter || '';
      applyFilter();
    });
  });

  var fsSel = document.getElementById('filter-service');
  if (fsSel) {
    fsSel.addEventListener('change', function () {
      serviceFilter = this.value || '';
      applyFilter();
    });
  }

  $('btn-csv').addEventListener('click', function () {
    var rows = [['Fecha', 'Nombre', 'Empresa', 'Email', 'Telefono', 'Servicio', 'Estado', 'Mensaje'].join(';')];
    leadsCache.filter(leadPassesFilters).forEach(function (l) {
      rows.push([
        fmtDate(l.created_at), l.nombre, l.empresa || '', l.email || '', l.telefono || '',
        l.tipo_servicio || '', l.estado, (l.mensaje || '').replace(/\r?\n/g, ' ')
      ].map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(';'));
    });
    var blob = new Blob(['﻿' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'faraday-consultas-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); link.remove(); }, 120);
  });

  /* ================= AUTH ================= */

  var loginForm = $('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (DEMO) {
        bootDemo();
        return;
      }
      var em = $('login-email').value.trim();
      var pw = $('login-password').value;
      if (!em || !pw) { els.loginError.textContent = 'Completa email y contrasena'; return; }
      els.loginError.textContent = 'Entrando...';
      db.auth.signInWithPassword({ email: em, password: pw }).then(function (r) {
        if (r.error) {
          els.loginError.textContent = 'Error: ' + (r.error.message || 'credenciales invalidas');
          return;
        }
        db.auth.getSession().then(function (s) {
          if (s.data && s.data.session) handleRealSession(s.data.session);
        }).catch(function () {
          els.loginError.textContent = 'Sin conexion con el servidor. Verifica internet o la configuracion de Supabase.';
        });
      }).catch(function () {
        els.loginError.textContent = 'Sin conexion con el servidor. Verifica internet o la configuracion de Supabase.';
      });
    });
  }

  var googleBtn = $('btn-google');
  if (googleBtn) {
    googleBtn.addEventListener('click', function () {
      if (DEMO) { bootDemo(); return; }
      els.loginError.textContent = 'Redirigiendo a Google...';
      db.auth.signInWithOAuth({ provider: 'google' });
    });
  }

  function bootDemo() {
    els.loginError.textContent = '';
    bootMain('super_admin', 'demo@faraday.local', 'u1');
    loadLeads();
    loadTeam();
  }

  function handleRealSession(session) {
    db.from('admin_profiles').select('*').eq('user_id', session.user.id).single().then(function (r) {
      if (r.error || !r.data) { onLogout(); return; }
      var p = r.data;
      if (p.role === 'pending') { showView('pending'); return; }
      bootMain(p.role, p.email, p.user_id);
      loadLeads();
      if (p.role === 'super_admin') loadTeam();
    });
  }

  $('btn-logout').addEventListener('click', onLogout);
  $('btn-pending-logout').addEventListener('click', onLogout);

  function onLogout() {
    currentRole = null; currentUserEmail = null; currentUserId = null;
    leadsCache = []; teamCache = [];
    hidePush();
    if (!DEMO) db.auth.signOut();
    showView('login');
  }

  $('btn-refresh').addEventListener('click', function () { loadLeads(); if (currentRole === 'super_admin') loadTeam(); });

  document.querySelectorAll('.admin-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.admin-view').forEach(function (v) { v.classList.toggle('active', v.dataset.view === tab.dataset.view); });
      if (tab.dataset.view === 'equipo') loadTeam();
      if (tab.dataset.view === 'kanban') renderKanban();
      if (tab.dataset.view === 'testimonios') loadTestimonios();
    });
  });

  function smartCard(lead) {
    var svc = lead.tipo_servicio && lead.tipo_servicio.length > 20 ? lead.tipo_servicio.split(' ')[0] : (lead.tipo_servicio || 'CONSULTA');
    var el = document.createElement('div');
    el.className = 'lead-item';
    el.style.marginBottom = '0';
    el.draggable = true;
    el.innerHTML = '<span class="lead-dot" style="background:' + getLeadColor(lead.estado) + '"></span>' +
      '<span class="lead-main"><span class="lead-name">' + esc(lead.nombre) + '</span>' +
      '<span class="lead-meta">' + esc(svc) + ' · ' + fmtDate(lead.created_at).split(',')[0] + '</span></span>';
    el.addEventListener('click', function () { openDetail(lead); });
    el.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', lead.id); e.dataTransfer.effectAllowed = 'move'; });
    var moveSel = document.createElement('select');
    moveSel.className = 'member-select';
    moveSel.style.cssText = 'margin-top:0.4rem;width:100%;font-size:0.55rem';
    ['nuevo','leido','contactado','cerrado'].forEach(function (st) {
      var o = document.createElement('option');
      o.value = st; o.textContent = 'Elija estado: ' + st.toUpperCase();
      if (st === lead.estado) o.selected = true;
      moveSel.appendChild(o);
    });
    moveSel.addEventListener('click', function (e) { e.stopPropagation(); });
    moveSel.addEventListener('change', function () { var n = moveSel.value; leadsCache = leadsCache.map(function (l) { return l.id === lead.id ? Object.assign({}, l, { estado: n }) : l; }); setEstado(lead, n); renderKanban(); });
    el.appendChild(moveSel);
    return el;
  }

  function renderKanban() {
    document.querySelectorAll('.kanban-col').forEach(function (col) {
      var st = col.dataset.estado;
      var wrap = col.querySelector('.kanban-cards');
      wrap.innerHTML = '';
      var mine = leadsCache.filter(function (l) { return l.estado === st; });
      if (!mine.length) {
        var p = document.createElement('p');
        p.textContent = 'vacio';
        p.style.cssText = 'font-family:var(--font-mono);font-size:0.55rem;color:var(--gray-500);letter-spacing:0.1em;padding:0.5rem 0;text-transform:uppercase';
        wrap.appendChild(p);
      }
      mine.forEach(function (l) { wrap.appendChild(smartCard(l)); });
    });
  }

  if (!kanbanDropRegistered) {
    kanbanDropRegistered = true;
    document.querySelectorAll('.kanban-col').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); });
      col.addEventListener('drop', function (e) {
        e.preventDefault();
        var id = e.dataTransfer.getData('text/plain');
        var lead = leadsCache.find(function (x) { return x.id === id; });
        if (lead) setEstado(lead, col.dataset.estado);
      });
    });
  }

  var kanbanDropRegistered = false;

  $('detail-close').addEventListener('click', closeDetail);
  els.overlay.addEventListener('click', function (e) { if (e.target === els.overlay) closeDetail(); });

  /* ================= INIT ================= */
  if (DEMO) {
    els.loginError.textContent = 'MODO DEMO — Entra sin credenciales para probar el panel. Cuando configures Supabase, esto pasa a login real.';
  } else {
    db.auth.getSession().then(function (s) {
      if (s.data && s.data.session) handleRealSession(s.data.session);
    });
  }

  function subscribeRealtime() {
    if (DEMO) return;
    db.channel('contact_submissions_insert')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_submissions' }, function (payload) {
        if (payload && payload.new) {
          leadsCache.unshift(payload.new);
          applyFilter();
          var badge = document.getElementById('badge-leads');
          if (badge) badge.textContent = leadsCache.length;
        }
      })
      .subscribe();
  }

  var installPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    installPrompt = e;
    var btn = document.getElementById('btn-install');
    if (btn) return;
    btn = document.createElement('button');
    btn.id = 'btn-install';
    btn.type = 'button';
    btn.className = 'btn-estado';
    btn.textContent = 'INSTALAR APP';
    var topbar = document.querySelector('.admin-topbar');
    if (topbar) {
      var right = topbar.querySelector('div');
      if (right) right.insertBefore(btn, right.firstChild);
    }
    btn.addEventListener('click', function () {
      btn.remove();
      installPrompt.prompt();
      installPrompt.userChoice.then(function () { installPrompt = null; });
    });
  });
})();

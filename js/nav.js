/* ═══════════════════════════════════════════════════════
   FARADAY ENERGY - Navigation
   Scroll strip collapse, desktop dropdown, mobile menu,
   hamburger toggle, services accordion
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var nav = document.querySelector('.nav');
  var toggle = document.querySelector('.nav__toggle');
  var mobile = document.querySelector('.nav__mobile');
  var mClose = document.querySelector('.nav__m-close');
  var servicesBtn = document.getElementById('nav-services-btn');
  var drop = document.getElementById('nav-dropdown');
  var dropItem = document.querySelector('.nav__item--has-drop');
  var mServicesBtn = document.querySelector('.nav__m-link--btn');
  var mAcc = document.getElementById('nav-m-acc');

  /* ---------- Scroll: collapse strip + close dropdown ---------- */
  function refreshScrolledState() {
    var scrolled = window.scrollY > 10;
    if (nav) nav.classList.toggle('is-scrolled', scrolled);
    if (scrolled) closeDrop();
  }
  window.addEventListener('scroll', refreshScrolledState, { passive: true });
  refreshScrolledState();

  /* ---------- Mobile menu ---------- */
  function openMobile() {
    if (!mobile) return;
    mobile.classList.add('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobile() {
    if (!mobile) return;
    mobile.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (mAcc) mAcc.classList.remove('is-open');
    if (mServicesBtn) mServicesBtn.setAttribute('aria-expanded', 'false');
  }
  function toggleMobile() {
    if (mobile && mobile.classList.contains('is-open')) closeMobile();
    else openMobile();
  }

  if (toggle) toggle.addEventListener('click', toggleMobile);
  if (mClose) mClose.addEventListener('click', closeMobile);
  if (mobile) {
    var mLinks = mobile.querySelectorAll('a');
    for (var i = 0; i < mLinks.length; i++) {
      mLinks[i].addEventListener('click', closeMobile);
    }
  }

  /* ---------- Desktop SERVICES dropdown ---------- */
  function openDrop() {
    if (!drop) return;
    drop.classList.add('is-open');
    if (servicesBtn) servicesBtn.setAttribute('aria-expanded', 'true');
  }
  function closeDrop() {
    if (!drop) return;
    drop.classList.remove('is-open');
    if (servicesBtn) servicesBtn.setAttribute('aria-expanded', 'false');
  }
  function toggleDrop() {
    if (drop.classList.contains('is-open')) closeDrop();
    else openDrop();
  }

  /* Hover open/close only on fine pointers */
  var finePointer = window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* Hover: small intent delay avoids flicker on fast mouse passes */
  var hoverOpenTimer = 0;
  var hoverCloseTimer = 0;

  if (dropItem && finePointer) {
    dropItem.addEventListener('mouseenter', function () {
      if (hoverCloseTimer) clearTimeout(hoverCloseTimer);
      hoverCloseTimer = 0;
      hoverOpenTimer = setTimeout(openDrop, 120);
    });
    dropItem.addEventListener('mouseleave', function () {
      if (hoverOpenTimer) clearTimeout(hoverOpenTimer);
      hoverOpenTimer = 0;
      hoverCloseTimer = setTimeout(closeDrop, 180);
    });
  }

  if (servicesBtn) {
    servicesBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleDrop();
    });
  }

  /* Click outside closes dropdown */
  document.addEventListener('click', function (e) {
    if (!drop || !drop.classList.contains('is-open')) return;
    if (drop.contains(e.target) || (servicesBtn && servicesBtn.contains(e.target))) return;
    closeDrop();
  });

  /* ---------- Mobile SERVICES accordion ---------- */
  if (mServicesBtn && mAcc) {
    mServicesBtn.addEventListener('click', function () {
      var isOpen = mAcc.classList.toggle('is-open');
      mServicesBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* ---------- Escape closes menu first, then dropdown ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (mobile && mobile.classList.contains('is-open')) closeMobile();
    else closeDrop();
  });

  /* Reset menu when resizing past mobile */
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) closeMobile();
  });
})();
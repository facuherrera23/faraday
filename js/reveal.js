/* ═══════════════════════════════════════════════════════
   FARADAY ENERGY — Scroll Reveal
   IntersectionObserver-based animations
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* Respect reduced motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var els = document.querySelectorAll('.reveal, .line-draw, .fade-in');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.add('visible');
    }
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('visible');
          observer.unobserve(entries[i].target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  var revealEls = document.querySelectorAll('.reveal, .line-draw, .fade-in');
  for (var j = 0; j < revealEls.length; j++) {
    observer.observe(revealEls[j]);
  }
})();

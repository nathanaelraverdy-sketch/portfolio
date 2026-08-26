/* Page "In progress" : l'échelle de chaque carte dépend en continu de sa
   distance au centre de l'écran (proportionnel au scroll), pas d'une zone
   binaire. Optimisé pour ne pas ralentir le scroll : les positions sont
   mesurées une seule fois (au chargement / resize), puis le calcul par
   frame de scroll ne fait que de l'arithmétique (pas de nouvelle lecture
   de layout, qui est ce qui causait la latence). */
(function () {
  const MIN_SCALE = 0.82;
  const MAX_SCALE = 1.1;
  const FALLOFF = 0.9; // fraction de la hauteur de la fenêtre

  let cache = [];
  let ticking = false;

  function measure() {
    const items = document.querySelectorAll('.inprogress-item');
    cache = Array.from(items).map(el => {
      const rect = el.getBoundingClientRect();
      return { el, top: rect.top + window.scrollY, height: rect.height };
    });
  }

  function updateFocus() {
    ticking = false;
    if (!cache.length) return;

    const viewportCenter = window.scrollY + window.innerHeight / 2;
    const maxDist = window.innerHeight * FALLOFF;

    cache.forEach(({ el, top, height }) => {
      const itemCenter = top + height / 2;
      const dist = Math.min(Math.abs(itemCenter - viewportCenter), maxDist);
      const t = 1 - dist / maxDist;
      const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
      el.style.transform = `scale(${scale.toFixed(3)})`;
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateFocus);
    }
  }

  function refresh() {
    measure();
    updateFocus();
  }

  // Appelé manuellement après le rendu async des cartes.
  window.updateCardFocus = refresh;

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', refresh);
  window.addEventListener('load', refresh);
  document.addEventListener('DOMContentLoaded', () => setTimeout(refresh, 50));
})();

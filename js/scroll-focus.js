/* Page "In progress" : l'échelle de chaque carte dépend en continu de sa
   distance au centre de l'écran (proportionnel au scroll) — pas de zone
   binaire "dedans/dehors", ça grandit/rétrécit progressivement au fil du
   scroll. La lenteur perçue vient de la transition CSS sur .project-card /
   .phase-card, qui "rattrape" en douceur la valeur cible à chaque frame. */
(function () {
  const MIN_SCALE = 0.82;
  const MAX_SCALE = 1.1;
  // Distance (en px) au-delà de laquelle une carte est à son échelle minimale.
  const FALLOFF = 0.9; // fraction de la hauteur de la fenêtre

  let ticking = false;

  function updateFocus() {
    ticking = false;
    const items = document.querySelectorAll('.inprogress-item');
    if (!items.length) return;

    const viewportCenter = window.innerHeight / 2;
    const maxDist = window.innerHeight * FALLOFF;

    items.forEach(item => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const dist = Math.min(Math.abs(itemCenter - viewportCenter), maxDist);
      const t = 1 - dist / maxDist; // 1 = pile au centre, 0 = au bord de la zone
      const scale = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;
      item.style.transform = `scale(${scale.toFixed(3)})`;
      item.style.zIndex = t > 0.5 ? 4 : 1;
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateFocus);
    }
  }

  window.updateCardFocus = updateFocus; // appelé manuellement après le rendu async des cartes

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', updateFocus);
  document.addEventListener('DOMContentLoaded', () => setTimeout(updateFocus, 50));
})();

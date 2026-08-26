/* Page "In progress" : l'échelle de chaque carte dépend en continu de sa
   distance au centre de l'écran. Au lieu d'une transition CSS à durée fixe
   (qui décroche quand on scrolle vite, car chaque nouvelle valeur relance
   une transition de 2.5s vers une cible qui a déjà bougé), on anime "à la
   main" via une boucle requestAnimationFrame qui rattrape la valeur cible
   d'une fraction constante à chaque frame (lerp). Résultat : ça reste doux
   à faible vitesse de scroll, et ça ne prend jamais de retard irrattrapable
   à vitesse de scroll élevée, car on se resynchronise sur scrollY à chaque
   frame plutôt que de dépendre des seuls événements "scroll". */
(function () {
  const MIN_SCALE = 0.82;
  const MAX_SCALE = 1.1;
  const FALLOFF = 0.9;   // fraction de la hauteur de la fenêtre
  const SMOOTHING = 0.06; // 0–1 : plus petit = plus lent à rattraper la cible

  let cache = [];

  function measure() {
    const items = document.querySelectorAll('.inprogress-item');
    cache = Array.from(items).map(el => {
      const rect = el.getBoundingClientRect();
      return {
        el,
        top: rect.top + window.scrollY,
        height: rect.height,
        current: parseFloat(el.dataset.scale || '1')
      };
    });
  }

  function tick() {
    if (cache.length) {
      const viewportCenter = window.scrollY + window.innerHeight / 2;
      const maxDist = window.innerHeight * FALLOFF;

      cache.forEach(item => {
        const itemCenter = item.top + item.height / 2;
        const dist = Math.min(Math.abs(itemCenter - viewportCenter), maxDist);
        const t = 1 - dist / maxDist;
        const target = MIN_SCALE + (MAX_SCALE - MIN_SCALE) * t;

        item.current += (target - item.current) * SMOOTHING;
        item.el.style.transform = `scale(${item.current.toFixed(4)})`;
        item.el.dataset.scale = item.current;
      });
    }
    requestAnimationFrame(tick);
  }

  function refresh() {
    measure();
  }

  // Appelé manuellement après le rendu async des cartes.
  window.updateCardFocus = refresh;

  window.addEventListener('resize', refresh);
  window.addEventListener('load', refresh);
  document.addEventListener('DOMContentLoaded', () => setTimeout(refresh, 50));

  requestAnimationFrame(tick); // boucle continue, indépendante des événements de scroll
})();

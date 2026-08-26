/* Page "In progress" : au scroll, la carte la plus proche du centre de l'écran
   grandit (.in-focus) ; les autres reviennent à leur taille normale. */
(function () {
  let ticking = false;

  function updateFocus() {
    ticking = false;
    const cards = document.querySelectorAll('.inprogress-item');
    if (!cards.length) return;

    const viewportCenter = window.innerHeight / 2;
    let closest = null;
    let closestDist = Infinity;

    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const dist = Math.abs(cardCenter - viewportCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closest = card;
      }
    });

    cards.forEach(card => card.classList.toggle('in-focus', card === closest));
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

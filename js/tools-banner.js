/* Bannière d'outils (page Work) : icônes en éventail, parfaitement
   statiques tant que le curseur n'est pas réellement passé dessus. Quand le
   curseur s'approche d'une icône, elle se redresse, se soulève et grossit —
   mais reste à sa place dans l'empilement (elle ne passe jamais devant ses
   voisines). Chaque icône réagit indépendamment, selon sa propre distance
   au curseur.

   Les icônes elles-mêmes sont injectées dynamiquement depuis
   data/tools.json (éditable dans l'admin en ligne) : window.initToolsBanner()
   est donc appelée après ce rendu, pas au chargement du script. */
(function () {
  const RADIUS = 190;   // px — distance à partir de laquelle une icône réagit
  const MAX_PULL = 26;  // px — déplacement max vers le curseur
  const LIFT = 30;      // px — soulèvement max au survol
  const EASE = 0.16;
  const ROT_EASE = 0.2;

  let running = false;

  window.initToolsBanner = function initToolsBanner() {
    const icons = Array.from(document.querySelectorAll('.tool-icon'));
    if (!icons.length) return;

    const state = icons.map(el => {
      const restRot = parseFloat(getComputedStyle(el).getPropertyValue('--rest-rot')) || 0;
      return {
        el,
        restRot,
        x: 0, y: 0, rotDelta: 0, scale: 1,
        targetX: 0, targetY: 0, targetRotDelta: 0, targetScale: 1
      };
    });

    let mouseX = -9999;
    let mouseY = -9999;
    let moved = false; // n'anime rien tant que la souris n'a pas réellement bougé

    document.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      moved = true;
    });

    function tick() {
      if (moved) {
        state.forEach(s => {
          const rect = s.el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = mouseX - cx;
          const dy = mouseY - cy;
          const dist = Math.hypot(dx, dy);

          if (dist < RADIUS) {
            const pull = 1 - dist / RADIUS;
            const norm = dist || 1;
            s.targetX = (dx / norm) * pull * MAX_PULL;
            s.targetY = (dy / norm) * pull * MAX_PULL - pull * LIFT;
            s.targetScale = 1 + pull * 0.26;
            s.targetRotDelta = -s.restRot * pull; // se redresse en sortant de la pile
          } else {
            s.targetX = 0;
            s.targetY = 0;
            s.targetScale = 1;
            s.targetRotDelta = 0;
          }

          s.x += (s.targetX - s.x) * EASE;
          s.y += (s.targetY - s.y) * EASE;
          s.scale += (s.targetScale - s.scale) * EASE;
          s.rotDelta += (s.targetRotDelta - s.rotDelta) * ROT_EASE;

          s.el.style.setProperty('--tx', s.x.toFixed(2) + 'px');
          s.el.style.setProperty('--ty', s.y.toFixed(2) + 'px');
          s.el.style.setProperty('--rot', s.rotDelta.toFixed(2) + 'deg');
          s.el.style.setProperty('--scale', s.scale.toFixed(3));
        });
      }
      requestAnimationFrame(tick);
    }

    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };
})();

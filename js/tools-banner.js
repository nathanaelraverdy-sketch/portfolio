/* Bannière "Mes outils" (page Work) : les icônes sont disposées en éventail
   (pile de tuiles qui se chevauchent) et restent parfaitement statiques tant
   que le curseur n'est pas réellement passé dessus. Quand le curseur
   s'approche d'une icône, celle-ci se redresse, se soulève légèrement et
   ressort de la pile — chaque icône réagit indépendamment, selon sa propre
   distance au curseur. */
(function () {
  const icons = Array.from(document.querySelectorAll('.tool-icon'));
  if (!icons.length) return;

  const RADIUS = 130;   // px — distance à partir de laquelle une icône réagit
  const MAX_PULL = 14;  // px — déplacement max vers le curseur
  const LIFT = 16;      // px — soulèvement max quand l'icône "sort" de la pile
  const EASE = 0.15;
  const ROT_EASE = 0.18;

  const state = icons.map(el => {
    const restRot = parseFloat(getComputedStyle(el).getPropertyValue('--rest-rot')) || 0;
    const baseZ = getComputedStyle(el).getPropertyValue('--z') || 1;
    return {
      el,
      restRot,
      baseZ,
      x: 0, y: 0, rotDelta: 0, scale: 1,
      targetX: 0, targetY: 0, targetRotDelta: 0, targetScale: 1,
      active: false
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
          s.targetScale = 1 + pull * 0.15;
          s.targetRotDelta = -s.restRot * pull; // se redresse en sortant de la pile
          if (!s.active) { s.active = true; s.el.style.zIndex = 20; }
        } else {
          s.targetX = 0;
          s.targetY = 0;
          s.targetScale = 1;
          s.targetRotDelta = 0;
          if (s.active) { s.active = false; s.el.style.zIndex = s.baseZ; }
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

  requestAnimationFrame(tick);
})();

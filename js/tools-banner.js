/* Bannière "Mes outils" (page Work) : chaque icône a sa propre physique —
   elle est attirée vers le curseur seulement quand celui-ci est proche
   d'elle (indépendamment des autres), avec un ressort/inertie pour la
   fluidité, et un léger flottement propre à chacune au repos.
   Inspiré du comportement de spencergabor.work. */
(function () {
  const icons = Array.from(document.querySelectorAll('.tool-icon'));
  if (!icons.length) return;

  const RADIUS = 150;        // px — distance à partir de laquelle une icône réagit au curseur
  const MAX_PULL = 20;       // px — déplacement max vers le curseur
  const EASE = 0.12;         // vitesse de rattrapage (ressort)
  const ROT_EASE = 0.15;
  const IDLE_AMPLITUDE = 3;  // px — léger flottement au repos, propre à chaque icône

  const state = icons.map(el => ({
    el,
    x: 0, y: 0, rot: 0, scale: 1,
    targetX: 0, targetY: 0, targetScale: 1,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 0.6
  }));

  let mouseX = -9999;
  let mouseY = -9999;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function tick(t) {
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
        s.targetY = (dy / norm) * pull * MAX_PULL;
        s.targetScale = 1 + pull * 0.14;
      } else {
        s.targetX = Math.sin(t / 1000 * s.speed + s.phase) * IDLE_AMPLITUDE;
        s.targetY = Math.cos(t / 1000 * s.speed * 0.8 + s.phase) * IDLE_AMPLITUDE;
        s.targetScale = 1;
      }

      const prevX = s.x;
      s.x += (s.targetX - s.x) * EASE;
      s.y += (s.targetY - s.y) * EASE;
      s.scale += (s.targetScale - s.scale) * EASE;

      const velocity = s.x - prevX;
      s.rot += (velocity * 0.8 - s.rot) * ROT_EASE;

      s.el.style.setProperty('--tx', s.x.toFixed(2) + 'px');
      s.el.style.setProperty('--ty', s.y.toFixed(2) + 'px');
      s.el.style.setProperty('--rot', s.rot.toFixed(2) + 'deg');
      s.el.style.setProperty('--scale', s.scale.toFixed(3));
    });
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

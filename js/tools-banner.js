/* Bannière "Mes outils" (page Work) : les icônes suivent légèrement le
   mouvement de la souris avec une inertie/ressort (inspiré de
   spencergabor.work), et reviennent doucement au repos quand la souris
   quitte la zone. */
(function () {
  const track = document.querySelector('.tools-banner-icons');
  if (!track) return;

  const icons = Array.from(track.querySelectorAll('.tool-icon'));
  if (!icons.length) return;

  const MAX_OFFSET_X = 26; // px, décalage horizontal max
  const MAX_OFFSET_Y = 16; // px, décalage vertical max
  const EASE = 0.09;       // vitesse de rattrapage vers la cible (ressort)
  const ROT_EASE = 0.15;

  const state = icons.map(el => ({
    el,
    strength: 0.55 + Math.random() * 0.55, // sensibilité propre à chaque icône (effet de profondeur)
    x: 0, y: 0, rot: 0,
    targetX: 0, targetY: 0
  }));

  let mouseX = 0.5;
  let mouseY = 0.5;
  let hovering = false;

  track.addEventListener('mousemove', e => {
    const rect = track.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / rect.width;
    mouseY = (e.clientY - rect.top) / rect.height;
    hovering = true;
  });

  track.addEventListener('mouseleave', () => { hovering = false; });

  function tick() {
    state.forEach(s => {
      if (hovering) {
        s.targetX = (mouseX - 0.5) * 2 * MAX_OFFSET_X * s.strength;
        s.targetY = (mouseY - 0.5) * 2 * MAX_OFFSET_Y * s.strength;
      } else {
        s.targetX = 0;
        s.targetY = 0;
      }

      const prevX = s.x;
      s.x += (s.targetX - s.x) * EASE;
      s.y += (s.targetY - s.y) * EASE;

      const velocity = s.x - prevX;
      s.rot += (velocity * 0.7 - s.rot) * ROT_EASE;

      s.el.style.setProperty('--tx', s.x.toFixed(2) + 'px');
      s.el.style.setProperty('--ty', s.y.toFixed(2) + 'px');
      s.el.style.setProperty('--rot', s.rot.toFixed(2) + 'deg');
    });
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

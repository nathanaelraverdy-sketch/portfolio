/* Rendu partagé des cartes projet + timeline de phases.
   Utilisé par in-progress.html et work.html. */

async function fetchProjects() {
  const res = await fetch('data/projects.json', { cache: 'no-store' });
  const data = await res.json();
  // Le fichier est maintenant { "projects": [...] } (format compatible Decap CMS),
  // avec un repli si jamais un ancien fichier "tableau brut" traîne encore.
  return Array.isArray(data) ? data : (data.projects || []);
}

function inverseTextColor(textColor) {
  return (textColor || '#ffffff').toLowerCase() === '#000000' ? '#ffffff' : '#000000';
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

function renderBadges(project) {
  const badges = [];
  if (project.version) badges.push(`<span class="badge">Version ${escapeHtml(project.version)}</span>`);
  (project.badges || []).forEach(b => badges.push(`<span class="badge">${escapeHtml(b)}</span>`));
  if (project.cta && project.cta.label) {
    const url = project.cta.url || '#';
    badges.push(`<a class="badge badge-cta" href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(project.cta.label)}</a>`);
  }
  return badges.join('');
}

function renderMedia(project) {
  if (project.video) {
    return `<video src="${escapeHtml(project.video)}" muted loop playsinline preload="metadata"></video>`;
  }
  if (project.image) {
    return `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}">`;
  }
  return `<span class="placeholder">Aperçu à venir</span>`;
}

function renderCard(project) {
  const categories = (project.categories || []).join(' · ');
  const desc = (project.description || [])
    .map(p => `<p>${escapeHtml(p)}</p>`).join('');
  const titleLink = project.contentHtml
    ? `<a href="project.html?id=${encodeURIComponent(project.id)}">${escapeHtml(project.title)}</a>`
    : escapeHtml(project.title);

  return `
    <article class="project-card" style="--card-color:${escapeHtml(project.color || '#1c3f6e')}; --card-text:${escapeHtml(project.textColor || '#ffffff')}; --card-text-inverse:${escapeHtml(inverseTextColor(project.textColor))}">
      <div class="card-text">
        <h3>${titleLink}</h3>
        ${categories ? `<p class="card-categories">${escapeHtml(categories)}</p>` : ''}
        <div class="card-desc">${desc}</div>
        <div class="card-badges">${renderBadges(project)}</div>
      </div>
      <div class="card-media">${renderMedia(project)}</div>
    </article>
  `;
}

function selectVisibleSteps(steps) {
  steps = steps || [];
  if (steps.length <= 3) return steps;

  let idx = steps.findIndex(s => s.status === 'current');
  if (idx === -1) {
    // Pas d'étape active : on affiche la dernière terminée + les 2 suivantes.
    idx = steps.reduce((last, s, i) => s.status === 'finished' ? i : last, 0);
  }

  let start = idx - 1;
  let end = idx + 1;
  if (start < 0) { start = 0; end = Math.min(steps.length - 1, 2); }
  if (end > steps.length - 1) { end = steps.length - 1; start = Math.max(0, end - 2); }
  return steps.slice(start, end + 1);
}

function renderPhaseCard(project) {
  const phase = project.phase;
  if (!phase) return '';
  const visibleSteps = selectVisibleSteps(phase.steps);
  const steps = visibleSteps.map(step => {
    const cls = step.status === 'finished' ? 'is-finished'
      : step.status === 'current' ? 'is-current' : '';
    const note = step.note ? `<span class="step-note">${escapeHtml(step.note)}</span>` : '';
    return `<div class="phase-step ${cls}">${escapeHtml(step.label)}${note ? '<br>' + note : ''}</div>`;
  }).join('');

  return `
    <div class="phase-card" style="--card-color:${escapeHtml(project.color || '#1c3f6e')}; --card-text:${escapeHtml(project.textColor || '#ffffff')}; --card-text-inverse:${escapeHtml(inverseTextColor(project.textColor))}">
      <h4>${escapeHtml(phase.title || 'Développement phases')}</h4>
      <div class="phase-col">
        <h5>${escapeHtml(phase.explanationTitle || 'Explanations')}</h5>
        <p>${escapeHtml(phase.explanation || '')}</p>
      </div>
      <div class="phase-col">
        <h5>${escapeHtml(phase.newsTitle || 'News')}</h5>
        <p>${escapeHtml(phase.news || '')}</p>
      </div>
      <div class="phase-timeline">${steps}</div>
    </div>
  `;
}

function wireVideoHover(root) {
  (root || document).querySelectorAll('.project-card').forEach(card => {
    const video = card.querySelector('.card-media video');
    if (!video || video.dataset.hoverWired) return;
    video.dataset.hoverWired = '1';
    card.addEventListener('mouseenter', () => video.play().catch(() => {}));
    card.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
  });
}

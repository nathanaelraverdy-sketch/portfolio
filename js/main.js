async function loadProjects() {
  const grid = document.getElementById('grid');
  try {
    const res = await fetch('data/projects.json', { cache: 'no-store' });
    const projects = await res.json();

    if (!Array.isArray(projects) || projects.length === 0) {
      grid.innerHTML = '<div class="empty-state">Aucun projet pour le moment. Ajoute-en un depuis l\'interface admin.</div>';
      return;
    }

    // plus récent en premier
    projects.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    grid.innerHTML = projects.map(renderCard).join('');
  } catch (err) {
    grid.innerHTML = '<div class="empty-state">Impossible de charger les projets (data/projects.json). ' +
      'Si tu ouvres ce fichier directement (file://), lance un petit serveur local, ex: <code>python3 -m http.server</code>.</div>';
    console.error(err);
  }
}

function renderCard(p) {
  const tags = (p.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const thumb = p.image
    ? `<img src="${escapeAttr(p.image)}" alt="">`
    : 'Pas d\'aperçu';
  const date = p.date ? `<div class="meta-date">${escapeHtml(p.date)}</div>` : '';

  return `
    <a class="card" href="project.html?id=${encodeURIComponent(p.id)}">
      <div class="thumb">${thumb}</div>
      <div class="body">
        <h3>${escapeHtml(p.title || 'Sans titre')}</h3>
        <p class="summary">${escapeHtml(p.summary || '')}</p>
        <div class="tags">${tags}</div>
        ${date}
      </div>
    </a>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
function escapeAttr(str) { return escapeHtml(str); }

loadProjects();

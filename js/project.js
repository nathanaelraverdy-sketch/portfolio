async function loadProject() {
  const id = new URLSearchParams(location.search).get('id');
  const titleEl = document.getElementById('title');
  const tagsEl = document.getElementById('tags');
  const frame = document.getElementById('frame');

  try {
    const res = await fetch('data/projects.json', { cache: 'no-store' });
    const projects = await res.json();
    const project = projects.find(p => p.id === id);

    if (!project) {
      titleEl.textContent = 'Projet introuvable';
      return;
    }

    document.title = project.title + ' — Portfolio';
    titleEl.textContent = project.title;
    tagsEl.innerHTML = (project.tags || [])
      .map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');

    // Le HTML du projet est écrit librement (avec ses propres <style>/<script>)
    // et rendu dans une iframe isolée, sans toucher au reste du site.
    frame.srcdoc = project.contentHtml || '<p style="font-family:sans-serif">Ce projet n\'a pas encore de contenu.</p>';
    frame.addEventListener('load', () => {
      try {
        const h = frame.contentWindow.document.body.scrollHeight;
        frame.style.height = (h + 40) + 'px';
      } catch (e) { frame.style.height = '600px'; }
    });
  } catch (err) {
    titleEl.textContent = 'Erreur de chargement';
    console.error(err);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

loadProject();

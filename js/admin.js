let projects = [];
let fileHandle = null;          // File System Access API handle (Chrome/Edge)
let useFsApi = 'showOpenFilePicker' in window;
let editingId = null;
let dirty = false;

const modeStatus = document.getElementById('modeStatus');
const saveStatus = document.getElementById('saveStatus');
const openBtn = document.getElementById('openBtn');
const fileInput = document.getElementById('fileInput');
const saveBtn = document.getElementById('saveBtn');
const listEl = document.getElementById('list');
const form = document.getElementById('projectForm');
const submitBtn = document.getElementById('submitBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formTitle = document.getElementById('formTitle');
const statusSelect = document.getElementById('f_status');
const phaseFields = document.getElementById('phaseFields');
const colorPicker = document.getElementById('f_color_picker');
const colorText = document.getElementById('f_color');
const pickImagesFolderBtn = document.getElementById('pickImagesFolderBtn');
const dropzone = document.getElementById('dropzone');
const dropPreview = document.getElementById('dropPreview');
const dropText = document.getElementById('dropText');
const dropHint = document.getElementById('dropHint');
const imageFileInput = document.getElementById('f_image_file');
const imageField = document.getElementById('f_image');
let imagesDirHandle = null;

// ---- Persistance des handles (File System Access API) via IndexedDB,
// pour rouvrir automatiquement le fichier/dossier au prochain chargement
// de la page, sans repasser par le sélecteur à chaque fois. ----
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('portfolio-admin', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite');
    tx.objectStore('handles').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(key) {
  const db = await idbOpen();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly');
    const req = tx.objectStore('handles').get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}



modeStatus.textContent = useFsApi
  ? 'Mode direct disponible : une fois le fichier ouvert une première fois, tes modifications sont enregistrées automatiquement dans data/projects.json (plus besoin de cliquer sur Enregistrer).'
  : 'Ton navigateur ne permet pas l\'écriture directe de fichier : après édition, un bouton te permettra de télécharger le fichier data/projects.json mis à jour, à remplacer manuellement dans ton dossier.';

tryAutoReconnect();
tryAutoReconnectImagesDir();

openBtn.addEventListener('click', openFile);
fileInput.addEventListener('change', onFileInputChange);
saveBtn.addEventListener('click', saveFile);
form.addEventListener('submit', onSubmit);
cancelEditBtn.addEventListener('click', resetForm);
statusSelect.addEventListener('change', updatePhaseVisibility);
colorPicker.addEventListener('input', () => colorText.value = colorPicker.value);
colorText.addEventListener('input', () => {
  if (/^#[0-9a-fA-F]{6}$/.test(colorText.value)) colorPicker.value = colorText.value;
});

pickImagesFolderBtn.addEventListener('click', pickImagesFolder);
dropzone.addEventListener('click', () => imageFileInput.click());
imageFileInput.addEventListener('change', e => {
  if (e.target.files[0]) handleImageFile(e.target.files[0]);
});
['dragenter', 'dragover'].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  })
);
['dragleave', 'drop'].forEach(evt =>
  dropzone.addEventListener(evt, e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  })
);
dropzone.addEventListener('drop', e => {
  const file = e.dataTransfer.files[0];
  if (file) handleImageFile(file);
});
imageField.addEventListener('input', () => updateImagePreview(imageField.value));


updatePhaseVisibility();

function updatePhaseVisibility() {
  phaseFields.style.display = statusSelect.value === 'in-progress' ? 'block' : 'none';
}

async function openFile() {
  if (useFsApi) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
        multiple: false
      });
      await loadFromHandle(handle);
      await idbSet('projectsFile', handle);
    } catch (err) {
      if (err.name !== 'AbortError') setStatus('Impossible d\'ouvrir le fichier : ' + err.message, 'err');
    }
  } else {
    fileInput.click();
  }
}

async function loadFromHandle(handle) {
  fileHandle = handle;
  const file = await handle.getFile();
  const text = await file.text();
  projects = JSON.parse(text || '[]');
  saveBtn.disabled = false;
  renderList();
  setStatus('Fichier chargé automatiquement (' + file.name + ').', 'ok');
}

async function tryAutoReconnect() {
  try {
    const handle = await idbGet('projectsFile');
    if (!handle) return;
    let perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      // Sans geste utilisateur, le navigateur refuse souvent silencieusement —
      // on tente quand même, ça marche dans certains cas (permission encore "fraîche").
      perm = await handle.requestPermission({ mode: 'readwrite' }).catch(() => 'prompt');
    }
    if (perm === 'granted') {
      await loadFromHandle(handle);
    } else {
      modeStatus.textContent = 'Fichier déjà connu — clique une fois sur "Ouvrir data/projects.json" pour redonner l\'accès (le navigateur redemande l\'autorisation de temps en temps).';
    }
  } catch (err) {
    // pas grave : l'utilisateur peut toujours ouvrir le fichier manuellement.
  }
}

function onFileInputChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      projects = JSON.parse(reader.result || '[]');
      saveBtn.disabled = false;
      renderList();
      setStatus('Fichier chargé en mémoire. Pense à télécharger après tes modifications.', 'ok');
    } catch (err) {
      setStatus('JSON invalide : ' + err.message, 'err');
    }
  };
  reader.readAsText(file);
}

async function saveFile() {
  const text = JSON.stringify(projects, null, 2);
  // markDirty() sera annulé si l'enregistrement réussit, voir plus bas.
  if (useFsApi && fileHandle) {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(text);
      await writable.close();
      dirty = false;
      updateSaveButtonState();
      setStatus('Enregistré dans data/projects.json ✓', 'ok');
    } catch (err) {
      setStatus('Échec de l\'enregistrement : ' + err.message, 'err');
    }
  } else {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'projects.json';
    a.click();
    URL.revokeObjectURL(url);
    dirty = false;
    updateSaveButtonState();
    setStatus('Fichier téléchargé — remplace data/projects.json avec ce fichier pour que les changements apparaissent sur le site.', 'ok');
  }
}

function markDirty() {
  dirty = true;
  updateSaveButtonState();
  if (useFsApi && fileHandle) {
    // Écriture directe disponible : on sauvegarde tout de suite, pas besoin de cliquer.
    saveFile();
  }
}

function updateSaveButtonState() {
  if (dirty) {
    saveBtn.textContent = '● Enregistrer les modifications (non sauvegardées)';
    saveBtn.style.background = '#f87171';
    saveBtn.style.color = '#1a0d0d';
    saveBtn.style.borderColor = '#f87171';
  } else {
    saveBtn.textContent = 'Enregistrer les modifications';
    saveBtn.style.background = '';
    saveBtn.style.color = '';
    saveBtn.style.borderColor = '';
  }
}

window.addEventListener('beforeunload', (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

function setStatus(msg, kind) {
  saveStatus.textContent = msg;
  saveStatus.className = 'status ' + (kind || '');
}

function renderList() {
  if (projects.length === 0) {
    listEl.innerHTML = '<p class="status">Aucun projet. Ajoute-en un ci-dessous.</p>';
    return;
  }
  listEl.innerHTML = projects.map(p => `
    <div class="list-item">
      <div class="info">
        <strong>${escapeHtml(p.title || p.id)}</strong>
        <small>${escapeHtml(p.id)} · ${p.status === 'in-progress' ? 'In progress' : 'Finished'} ${p.date ? '· ' + escapeHtml(p.date) : ''}</small>
      </div>
      <div class="actions">
        <button type="button" class="ghost" data-edit="${escapeAttr(p.id)}">Modifier</button>
        <button type="button" class="ghost" data-delete="${escapeAttr(p.id)}">Supprimer</button>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('[data-edit]').forEach(btn =>
    btn.addEventListener('click', () => startEdit(btn.dataset.edit)));
  listEl.querySelectorAll('[data-delete]').forEach(btn =>
    btn.addEventListener('click', () => deleteProject(btn.dataset.delete)));
}

const stepsList = document.getElementById('stepsList');
const addStepBtn = document.getElementById('addStepBtn');

addStepBtn.addEventListener('click', () => addStepRow());
setStepsUI(null);

function addStepRow(step) {
  step = step || { label: '', status: 'upcoming', note: '' };
  const row = document.createElement('div');
  row.className = 'step-row';
  row.innerHTML = `
    <input type="text" class="step-label" placeholder="Nom de l'étape (ex: Design)">
    <select class="step-status">
      <option value="finished">Terminée</option>
      <option value="current">Active</option>
      <option value="upcoming">À venir</option>
    </select>
    <input type="text" class="step-note" placeholder="Note (optionnel, ex: Work in progress)">
    <button type="button" class="step-remove" title="Supprimer cette étape">✕</button>
  `;
  row.querySelector('.step-label').value = step.label || '';
  row.querySelector('.step-status').value = step.status || 'upcoming';
  row.querySelector('.step-note').value = step.note || '';
  row.querySelector('.step-remove').addEventListener('click', () => row.remove());
  stepsList.appendChild(row);
}

function setStepsUI(steps) {
  stepsList.innerHTML = '';
  (steps && steps.length ? steps : [
    { label: 'Design', status: 'finished', note: 'Finished' },
    { label: 'Developpement', status: 'current', note: 'Work in progress' },
    { label: 'Beta testing', status: 'upcoming', note: '' }
  ]).forEach(addStepRow);
}

function collectStepsFromUI() {
  return Array.from(stepsList.querySelectorAll('.step-row')).map(row => ({
    label: row.querySelector('.step-label').value.trim(),
    status: row.querySelector('.step-status').value,
    note: row.querySelector('.step-note').value.trim() || undefined
  })).filter(s => s.label);
}

function paragraphsToText(paragraphs) {
  return (paragraphs || []).join('\n\n');
}

function textToParagraphs(text) {
  return text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
}

function startEdit(id) {
  const p = projects.find(x => x.id === id);
  if (!p) return;
  editingId = id;

  document.getElementById('f_title').value = p.title || '';
  document.getElementById('f_id').value = p.id || '';
  document.getElementById('f_status').value = p.status || 'in-progress';
  document.getElementById('f_date').value = p.date || '';
  document.getElementById('f_color').value = p.color || '#1c3f6e';
  document.getElementById('f_color_picker').value = p.color || '#1c3f6e';
  document.getElementById('f_text_color').value = p.textColor || '#ffffff';
  document.getElementById('f_categories').value = (p.categories || []).join(', ');
  document.getElementById('f_image').value = p.image || '';
  updateImagePreview(p.image || '');
  document.getElementById('f_version').value = p.version || '';
  document.getElementById('f_cta_label').value = (p.cta && p.cta.label) || '';
  document.getElementById('f_cta_url').value = (p.cta && p.cta.url) || '';
  document.getElementById('f_badges').value = (p.badges || []).join(', ');
  document.getElementById('f_description').value = paragraphsToText(p.description);
  document.getElementById('f_content').value = p.contentHtml || '';

  const phase = p.phase || {};
  document.getElementById('f_phase_title').value = phase.title || 'Developpement phases';
  document.getElementById('f_phase_expl_title').value = phase.explanationTitle || 'Explanations';
  document.getElementById('f_phase_news_title').value = phase.newsTitle || 'News';
  document.getElementById('f_phase_explanation').value = phase.explanation || '';
  document.getElementById('f_phase_news').value = phase.news || '';
  setStepsUI(phase.steps);

  updatePhaseVisibility();

  formTitle.textContent = 'Modifier « ' + (p.title || p.id) + ' »';
  submitBtn.textContent = 'Enregistrer les modifications';
  cancelEditBtn.style.display = 'inline-block';
  window.scrollTo({ top: document.getElementById('projectForm').offsetTop - 20, behavior: 'smooth' });
}

function deleteProject(id) {
  if (!confirm('Supprimer ce projet ?')) return;
  projects = projects.filter(p => p.id !== id);
  markDirty();
  renderList();
  setStatus('Projet supprimé — n\'oublie pas d\'enregistrer.', 'ok');
}

function resetForm() {
  editingId = null;
  form.reset();
  document.getElementById('f_phase_title').value = 'Developpement phases';
  document.getElementById('f_phase_expl_title').value = 'Explanations';
  document.getElementById('f_phase_news_title').value = 'News';
  document.getElementById('f_color').value = '#1c3f6e';
  document.getElementById('f_color_picker').value = '#1c3f6e';
  document.getElementById('f_text_color').value = '#ffffff';
  setStepsUI(null);
  formTitle.textContent = 'Ajouter un projet';
  submitBtn.textContent = 'Ajouter le projet';
  cancelEditBtn.style.display = 'none';
  updatePhaseVisibility();
  updateImagePreview('');
}

function onSubmit(e) {
  e.preventDefault();
  const title = document.getElementById('f_title').value.trim();
  let id = document.getElementById('f_id').value.trim();
  if (!id) id = slugify(title);

  const status = document.getElementById('f_status').value;

  const data = {
    id,
    title,
    status,
    date: document.getElementById('f_date').value,
    color: document.getElementById('f_color').value.trim() || '#1c3f6e',
    textColor: document.getElementById('f_text_color').value,
    categories: document.getElementById('f_categories').value.split(',').map(s => s.trim()).filter(Boolean),
    image: document.getElementById('f_image').value.trim(),
    version: document.getElementById('f_version').value.trim(),
    cta: {
      label: document.getElementById('f_cta_label').value.trim(),
      url: document.getElementById('f_cta_url').value.trim()
    },
    badges: document.getElementById('f_badges').value.split(',').map(s => s.trim()).filter(Boolean),
    description: textToParagraphs(document.getElementById('f_description').value),
    contentHtml: document.getElementById('f_content').value,
    phase: status === 'in-progress' ? {
      title: document.getElementById('f_phase_title').value.trim() || 'Developpement phases',
      explanationTitle: document.getElementById('f_phase_expl_title').value.trim() || 'Explanations',
      explanation: document.getElementById('f_phase_explanation').value.trim(),
      newsTitle: document.getElementById('f_phase_news_title').value.trim() || 'News',
      news: document.getElementById('f_phase_news').value.trim(),
      steps: collectStepsFromUI()
    } : null
  };

  if (editingId) {
    const idx = projects.findIndex(p => p.id === editingId);
    if (idx !== -1) projects[idx] = data;
    markDirty();
  } else {
    if (projects.some(p => p.id === id)) {
      setStatus('Un projet avec cet identifiant existe déjà.', 'err');
      return;
    }
    projects.push(data);
    markDirty();
  }

  renderList();
  resetForm();
  setStatus('Projet enregistré en mémoire — clique sur "Enregistrer les modifications" pour écrire le fichier.', 'ok');
}

async function pickImagesFolder() {
  if (!('showDirectoryPicker' in window)) {
    setStatus('Ton navigateur ne permet pas de choisir un dossier — les images seront intégrées directement dans le JSON.', 'err');
    return;
  }
  try {
    imagesDirHandle = await window.showDirectoryPicker();
    dropHint.textContent = 'Dossier "' + imagesDirHandle.name + '" sélectionné — les images glissées y seront écrites directement.';
    setStatus('Dossier images sélectionné (' + imagesDirHandle.name + ').', 'ok');
    await idbSet('imagesDir', imagesDirHandle);
  } catch (err) {
    if (err.name !== 'AbortError') setStatus('Impossible de choisir le dossier : ' + err.message, 'err');
  }
}

async function tryAutoReconnectImagesDir() {
  try {
    const handle = await idbGet('imagesDir');
    if (!handle) return;
    let perm = await handle.queryPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      perm = await handle.requestPermission({ mode: 'readwrite' }).catch(() => 'prompt');
    }
    if (perm === 'granted') {
      imagesDirHandle = handle;
      dropHint.textContent = 'Dossier "' + handle.name + '" reconnecté automatiquement.';
    }
  } catch (err) {
    // pas grave : on peut toujours cliquer sur "Choisir le dossier images/"
  }
}

function sanitizeFileName(name) {
  const parts = name.split('.');
  const ext = parts.length > 1 ? '.' + parts.pop().toLowerCase() : '';
  const base = parts.join('.').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return (base || 'image') + ext;
}

async function handleImageFile(file) {
  if (!file.type.startsWith('image/')) {
    setStatus('Le fichier déposé n\'est pas une image.', 'err');
    return;
  }

  if (imagesDirHandle) {
    try {
      const fileName = sanitizeFileName(file.name);
      const handle = await imagesDirHandle.getFileHandle(fileName, { create: true });
      const writable = await handle.createWritable();
      await writable.write(file);
      await writable.close();
      const relPath = 'images/' + fileName;
      imageField.value = relPath;
      updateImagePreview(relPath);
      setStatus('Image enregistrée dans ' + relPath + '.', 'ok');
      return;
    } catch (err) {
      setStatus('Échec de l\'écriture du fichier image : ' + err.message + ' — utilisation d\'un aperçu intégré à la place.', 'err');
    }
  }

  // Fallback (pas d'accès dossier) : on encode l'image directement dans le JSON.
  const reader = new FileReader();
  reader.onload = () => {
    imageField.value = reader.result;
    updateImagePreview(reader.result);
    setStatus('Image intégrée directement dans data/projects.json (pense à choisir le dossier images/ pour éviter d\'alourdir le fichier).', 'ok');
  };
  reader.readAsDataURL(file);
}

function updateImagePreview(src) {
  if (src) {
    dropPreview.src = src;
    dropPreview.style.display = 'block';
    dropText.style.display = 'none';
  } else {
    dropPreview.removeAttribute('src');
    dropPreview.style.display = 'none';
    dropText.style.display = 'block';
  }
}

function slugify(str) {
  return String(str).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'projet-' + Date.now();
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}
function escapeAttr(str) { return escapeHtml(str); }

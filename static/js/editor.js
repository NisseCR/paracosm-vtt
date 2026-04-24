/**
 * Scene Editor JS
 */

document.addEventListener('DOMContentLoaded', () => {
  if (window.EDIT_MODE) {
    initEditView();
  } else {
    initListView();
  }
});

let isDirty = false;

function setDirty(dirty) {
  isDirty = dirty;
  const indicator = document.getElementById('title-dirty-indicator');
  const pageIndicator = document.getElementById('dirty-indicator');
  if (indicator) indicator.style.display = dirty ? 'inline' : 'none';
  if (pageIndicator) pageIndicator.style.display = dirty ? 'inline' : 'none';
}

/**
 * List View
 */
async function initListView() {
  const tbody = document.getElementById('scene-list-body');
  try {
    const response = await fetch('/api/scenes');
    const scenes = await response.json();

    tbody.innerHTML = scenes.map(scene => `
      <tr>
        <td>${scene.id}</td>
        <td>${scene.name}</td>
        <td>${scene.background.split('/').pop()}</td>
        <td>${scene.layers.length}</td>
        <td class="row-actions">
          <a href="/editor/${scene.id}" class="action-link">Edit</a>
          <a href="#" class="action-link is-delete" onclick="deleteScene('${scene.id}'); return false;">Delete</a>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    showError("Failed to load scenes: " + err.message);
  }
}

async function deleteScene(id) {
  if (!confirm(`Are you sure you want to delete scene "${id}"?`)) return;

  try {
    const response = await fetch(`/api/scenes/${id}`, { method: 'DELETE' });
    if (response.ok) {
      initListView(); // Refresh
    } else {
      const data = await response.json();
      showError(data.message || "Delete failed");
    }
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
}

/**
 * Edit View
 */
async function initEditView() {
  const form = document.getElementById('scene-form');
  const saveBtn = document.getElementById('save-btn');
  const deleteBtn = document.getElementById('delete-btn');
  const cancelLink = document.getElementById('cancel-link');

  // Load existing scene
  if (window.SCENE_ID && window.SCENE_ID !== 'new') {
    try {
      const response = await fetch(`/api/scenes/${window.SCENE_ID}`);
      if (!response.ok) throw new Error("Scene not found");
      const scene = await response.json();

      document.getElementById('scene-id').value = scene.id;
      document.getElementById('scene-name').value = scene.name;
      document.getElementById('scene-background').value = stripStaticPrefix(scene.background);
      
      const layersJson = scene.layers.map(l => ({
        ...l,
        src: stripStaticPrefix(l.src)
      }));
      document.getElementById('scene-layers').value = JSON.stringify(layersJson, null, 2);
    } catch (err) {
      showError(err.message);
    }
  }

  // Dirty tracking
  form.addEventListener('input', () => setDirty(true));

  // Save handler
  saveBtn.addEventListener('click', saveScene);

  // Delete handler
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => deleteSceneAndRedirect(window.SCENE_ID));
  }

  // Beforeunload
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Ctrl+S
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveScene();
    }
  });

  // Cancel check
  cancelLink.addEventListener('click', (e) => {
    if (isDirty && !confirm("You have unsaved changes. Discard them?")) {
      e.preventDefault();
    }
  });
}

async function saveScene() {
  const idInput = document.getElementById('scene-id');
  const nameInput = document.getElementById('scene-name');
  const backgroundInput = document.getElementById('scene-background');
  const layersInput = document.getElementById('scene-layers');

  clearErrors();

  let layers = [];
  try {
    layers = JSON.parse(layersInput.value || '[]');
  } catch (err) {
    showFieldError('layers', "Invalid JSON: " + err.message);
    return;
  }

  const sceneData = {
    id: idInput.value.trim(),
    name: nameInput.value.trim(),
    background: stripStaticPrefix(backgroundInput.value.trim()),
    layers: layers.map(l => ({
      ...l,
      src: stripStaticPrefix(l.src)
    }))
  };

  const isNew = window.SCENE_ID === 'new';
  const url = isNew ? '/api/scenes' : `/api/scenes/${window.SCENE_ID}`;
  const method = isNew ? 'POST' : 'PUT';

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sceneData)
    });

    if (response.ok) {
      setDirty(false);
      window.location.href = '/editor';
    } else if (response.status === 422) {
      const data = await response.json();
      if (data.detail && Array.isArray(data.detail)) {
        // FastAPI validation errors
        data.detail.forEach(err => {
          const field = err.loc[err.loc.length - 1];
          showFieldError(field, err.msg);
        });
      } else {
        showError(data.message || "Validation failed");
      }
    } else if (response.status === 409) {
      showFieldError('id', "Scene ID already exists");
    } else {
      const data = await response.json();
      showError(data.message || "Save failed");
    }
  } catch (err) {
    showError("Save failed: " + err.message);
  }
}

async function deleteSceneAndRedirect(id) {
  if (!confirm(`Are you sure you want to delete scene "${id}"?`)) return;
  try {
    const response = await fetch(`/api/scenes/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setDirty(false);
      window.location.href = '/editor';
    } else {
      const data = await response.json();
      showError(data.message || "Delete failed");
    }
  } catch (err) {
    showError("Delete failed: " + err.message);
  }
}

/**
 * Helpers
 */
function stripStaticPrefix(path) {
  if (!path) return path;
  return path
    .replace(/^\/?static\/assets\/images\//, '')
    .replace(/^\/?static\/assets\/video\//, '');
}

function showError(msg) {
  const area = document.getElementById('error-area');
  if (area) {
    area.textContent = msg;
    area.style.display = 'block';
    window.scrollTo(0, 0);
  }
}

function showFieldError(field, msg) {
  const el = document.getElementById(`error-${field}`);
  if (el) {
    el.textContent = msg;
  } else {
    showError(`${field}: ${msg}`);
  }
}

function clearErrors() {
  const area = document.getElementById('error-area');
  if (area) area.style.display = 'none';
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

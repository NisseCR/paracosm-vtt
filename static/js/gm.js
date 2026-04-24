/**
 * Initialize the GM page behavior.
 *
 * The GM page edits a local draft state and syncs the full desired application
 * state to the backend on demand.
 */
async function initGmPage() {
  const [stateResponse, libraryResponse] = await Promise.all([
    fetch("/api/state"),
    fetch("/api/library"),
  ]);

  const canonicalState = await stateResponse.json();
  const library = await libraryResponse.json();

  const ui = createUiBindings();
  const draftState = createDraftState(canonicalState);

  bindFadeControls(ui, draftState);
  bindSyncButton(ui.syncButton, ui, library, draftState);
  renderAll(ui, library, draftState);
}

/**
 * Create DOM bindings for the GM page.
 *
 * Returns:
 *   A dictionary of relevant DOM elements.
 */
function createUiBindings() {
  return {
    currentScene: document.getElementById("current-scene"),
    currentMusic: document.getElementById("current-music"),
    sceneList: document.getElementById("scene-list"),
    musicList: document.getElementById("music-list"),
    ambienceList: document.getElementById("ambience-list"),
    fadeMusic: document.getElementById("fade-music"),
    fadeAmbience: document.getElementById("fade-ambience"),
    fadeScene: document.getElementById("fade-scene"),
    syncButton: document.getElementById("sync-state"),
  };
}

/**
 * Create a mutable draft copy of the application state.
 *
 * Args:
 *   state: The canonical state returned by the backend.
 *
 * Returns:
 *   A locally editable draft state.
 */
function createDraftState(state) {
  return {
    scene: state.scene ?? null,
    music: state.music ?? null,
    ambiences: structuredClone(state.ambiences ?? {}),
    fade_settings: {
      music: state.fade_settings?.music ?? 5.0,
      ambience: state.fade_settings?.ambience ?? 10.0,
      scene: state.fade_settings?.scene ?? 5.0,
    },
  };
}

/**
 * Build the sync payload expected by the backend.
 *
 * Args:
 *   draftState: The editable local state.
 *
 * Returns:
 *   A plain JSON-serializable payload.
 */
function createSyncPayload(draftState) {
  return {
    scene: draftState.scene,
    music: draftState.music,
    ambiences: draftState.ambiences,
    fade_settings: draftState.fade_settings,
  };
}

/**
 * Bind all UI handlers for the GM page.
 *
 * Args:
 *   ui: DOM element bindings.
 *   library: The discovered media library.
 *   draftState: The editable local state.
 */
function bindUiEvents(ui, library, draftState) {
  bindSceneSelection(ui.sceneList, ui, library, draftState);
  bindMusicSelection(ui.musicList, ui, library, draftState);
  bindAmbienceSelection(ui.ambienceList, ui, library, draftState);
  bindFadeControls(ui, draftState);
}

/**
 * Render all GM controls from the current draft state.
 *
 * Args:
 *   ui: DOM element bindings.
 *   library: The discovered media library.
 *   draftState: The editable local state.
 */
function renderAll(ui, library, draftState) {
  renderCurrentState(ui, draftState);
  renderSceneList(ui.sceneList, library, draftState, ui);
  renderMusicList(ui.musicList, library, draftState, ui);
  renderAmbienceList(ui.ambienceList, library, draftState, ui);
  renderFadeControls(ui, draftState);
}

/**
 * Render the current scene and music labels.
 *
 * Args:
 *   ui: DOM element bindings.
 *   draftState: The editable local state.
 */
function renderCurrentState(ui, draftState) {
  if (ui.currentScene) {
    ui.currentScene.textContent = draftState.scene?.scene_id ?? "None";
  }

  if (ui.currentMusic) {
    ui.currentMusic.textContent = draftState.music?.playlist_id ?? "None";
  }
}

/**
 * Render the scene selection list.
 *
 * Args:
 *   container: The scene list container.
 *   library: The discovered media library.
 *   draftState: The editable local state.
 *   ui: DOM element bindings.
 */
function renderSceneList(container, library, draftState, ui) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  library.scenes.forEach((scene) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = scene.name;
    button.classList.toggle("active", draftState.scene?.scene_id === scene.id);

    button.addEventListener("click", () => {
      draftState.scene = {
        scene_id: scene.id,
        transition: draftState.scene?.transition ?? null,
        opacity: draftState.scene?.opacity ?? 1.0,
      };
      renderAll(ui, library, draftState);
    });

    container.appendChild(button);
  });
}

/**
 * Render the music selection list.
 *
 * Args:
 *   container: The music list container.
 *   library: The discovered media library.
 *   draftState: The editable local state.
 *   ui: DOM element bindings.
 */
function renderMusicList(container, library, draftState, ui) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  library.music_playlists.forEach((playlist) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = playlist.name;
    button.classList.toggle("active", draftState.music?.playlist_id === playlist.id);

    button.addEventListener("click", () => {
      draftState.music = {
        playlist_id: playlist.id,
      };
      renderAll(ui, library, draftState);
    });

    container.appendChild(button);
  });
}

/**
 * Render ambience toggles.
 *
 * Args:
 *   container: The ambience list container.
 *   library: The discovered media library.
 *   draftState: The editable local state.
 *   ui: DOM element bindings.
 */
function renderAmbienceList(container, library, draftState, ui) {
  if (!container) {
    return;
  }

  container.innerHTML = "";

  library.ambience_folders.forEach((folder) => {
    folder.tracks.forEach((track) => {
      const ambienceId = track.name;
      const isActive = Boolean(draftState.ambiences[ambienceId]);

      const wrapper = document.createElement("div");
      wrapper.className = "ambience-control";

      const toggleButton = document.createElement("button");
      toggleButton.type = "button";
      toggleButton.textContent = isActive ? `Remove ${track.name}` : `Add ${track.name}`;
      toggleButton.classList.toggle("active", isActive);

      toggleButton.addEventListener("click", () => {
        if (draftState.ambiences[ambienceId]) {
          delete draftState.ambiences[ambienceId];
        } else {
          draftState.ambiences[ambienceId] = {
            ambience_id: ambienceId,
            volume: 1.0,
          };
        }

        renderAll(ui, library, draftState);
      });

      wrapper.appendChild(toggleButton);
      container.appendChild(wrapper);
    });
  });
}

/**
 * Render fade duration inputs.
 *
 * Args:
 *   ui: DOM element bindings.
 *   draftState: The editable local state.
 */
function renderFadeControls(ui, draftState) {
  if (ui.fadeMusic) {
    ui.fadeMusic.value = draftState.fade_settings.music;
  }

  if (ui.fadeAmbience) {
    ui.fadeAmbience.value = draftState.fade_settings.ambience;
  }

  if (ui.fadeScene) {
    ui.fadeScene.value = draftState.fade_settings.scene;
  }
}

/**
 * Bind fade input handlers so they update the draft state.
 *
 * Args:
 *   ui: DOM element bindings.
 *   draftState: The editable local state.
 */
function bindFadeControls(ui, draftState) {
  if (ui.fadeMusic) {
    ui.fadeMusic.addEventListener("change", () => {
      draftState.fade_settings.music = Number(ui.fadeMusic.value);
    });
  }

  if (ui.fadeAmbience) {
    ui.fadeAmbience.addEventListener("change", () => {
      draftState.fade_settings.ambience = Number(ui.fadeAmbience.value);
    });
  }

  if (ui.fadeScene) {
    ui.fadeScene.addEventListener("change", () => {
      draftState.fade_settings.scene = Number(ui.fadeScene.value);
    });
  }
}

/**
 * Bind the sync button to submit the full draft state.
 *
 * Args:
 *   button: The sync button element.
 *   ui: DOM element bindings.
 *   library: The discovered media library.
 *   draftState: The editable local state.
 */
function bindSyncButton(button, ui, library, draftState) {
  if (!button) {
    return;
  }

  button.addEventListener("click", async () => {
    try {
      const updatedState = await syncState(createSyncPayload(draftState));

      draftState.scene = updatedState.scene ?? null;
      draftState.music = updatedState.music ?? null;
      draftState.ambiences = structuredClone(updatedState.ambiences ?? {});
      draftState.fade_settings = {
        music: updatedState.fade_settings?.music ?? 5.0,
        ambience: updatedState.fade_settings?.ambience ?? 10.0,
        scene: updatedState.fade_settings?.scene ?? 5.0,
      };

      renderAll(ui, library, draftState);
      console.log("Sync succeeded:", updatedState);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  });
}

/**
 * Send the full draft state to the backend.
 *
 * Args:
 *   payload: The editable local state payload.
 *
 * Returns:
 *   The canonical backend state.
 */
async function syncState(payload) {
  const response = await fetch("/api/state/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }

  return response.json();
}

document.addEventListener("DOMContentLoaded", initGmPage);
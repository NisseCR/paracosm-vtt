/**
 * Initialize the display page behavior.
 *
 * This page is a read-only listener that receives live updates from the backend
 * via SSE and renders the active scene and audio state.
 */
async function initDisplayPage() {
  const eventSource = new EventSource("/events");

  const [libraryResponse] = await Promise.all([
    fetch("/api/library"),
  ]);

  const library = await libraryResponse.json();

  const displayScene = document.getElementById("display-scene");
  const displayMusic = document.getElementById("display-music");
  const displayState = document.getElementById("display-state");

  const sceneBackground = document.getElementById("scene-background");
  const sceneLayers = document.getElementById("scene-layers");
  const sceneFadeOverlay = document.getElementById("scene-fade-overlay");

  const sceneMap = new Map(
    library.scenes.map((scene) => [scene.id, scene])
  );

  let currentState = {
    current_scene: null,
    current_music_playlist: null,
    active_ambiences: {},
    fade_settings: {},
  };

  let currentSceneId = null;
  let isTransitioning = false;

  /**
   * Render the current application state into the display UI.
   *
   * Args:
   *   state: The latest known application state.
   */
  function renderState(state) {
    if (displayScene) {
      displayScene.textContent = state.current_scene?.scene_id ?? "None";
    }

    if (displayMusic) {
      displayMusic.textContent = state.current_music_playlist?.playlist_id ?? "None";
    }

    if (displayState) {
      displayState.textContent = JSON.stringify(state, null, 2);
    }
  }

  /**
   * Merge a partial state update into the current state and re-render.
   *
   * Args:
   *   patch: The partial update received from SSE.
   */
  function applyStatePatch(patch) {
    currentState = {
      ...currentState,
      ...patch,
    };
    renderState(currentState);
  }

  /**
   * Get the current fade duration for scene transitions in milliseconds.
   *
   * Returns:
   *   The fade duration in milliseconds.
   */
  function getSceneFadeDurationMs() {
    const fadeSeconds = Number(currentState.fade_settings?.scene ?? 5.0);
    return Math.max(0, fadeSeconds * 1000);
  }

  /**
   * Fade the entire scene stage to black.
   *
   * Returns:
   *   A promise that resolves after the fade completes.
   */
  function fadeToBlack() {
    return new Promise((resolve) => {
      if (!sceneFadeOverlay) {
        resolve();
        return;
      }

      const durationMs = getSceneFadeDurationMs();
      sceneFadeOverlay.style.transitionDuration = `${durationMs}ms`;
      sceneFadeOverlay.classList.add("is-visible");
      window.setTimeout(resolve, durationMs);
    });
  }

  /**
   * Fade the entire scene stage back in from black.
   *
   * Returns:
   *   A promise that resolves after the fade completes.
   */
  function fadeInFromBlack() {
    return new Promise((resolve) => {
      if (!sceneFadeOverlay) {
        resolve();
        return;
      }

      const durationMs = getSceneFadeDurationMs();
      sceneFadeOverlay.style.transitionDuration = `${durationMs}ms`;
      sceneFadeOverlay.classList.remove("is-visible");
      window.setTimeout(resolve, durationMs);
    });
  }

  /**
   * Clear the current scene stage contents.
   */
  function clearSceneStage() {
    if (sceneBackground) {
      sceneBackground.removeAttribute("src");
      sceneBackground.alt = "Current scene background";
    }

    if (sceneLayers) {
      sceneLayers.innerHTML = "";
    }
  }

  /**
   * Render a scene definition into the stage.
   *
   * Args:
   *   scene: The scene definition from the library, or null.
   */
  function renderScene(scene) {
    clearSceneStage();

    if (!scene) {
      return;
    }

    if (sceneBackground) {
      sceneBackground.src = scene.background;
      sceneBackground.alt = scene.name;
    }

    if (sceneLayers) {
      scene.layers.forEach((layerUrl) => {
        if (layerUrl.endsWith(".webm")) {
          const video = document.createElement("video");
          video.className = "scene-layer-video";
          video.src = layerUrl;
          video.autoplay = true;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute("aria-hidden", "true");
          sceneLayers.appendChild(video);
          return;
        }

        const image = document.createElement("img");
        image.className = "scene-layer-image";
        image.src = layerUrl;
        image.alt = `${scene.name} layer`;
        sceneLayers.appendChild(image);
      });
    }
  }

  /**
   * Switch to a new scene with a fade-to-black transition.
   *
   * Args:
   *   sceneId: The new active scene identifier.
   */
  async function switchScene(sceneId) {
    if (isTransitioning) {
      currentSceneId = sceneId;
      return;
    }

    if (sceneId === currentSceneId) {
      return;
    }

    isTransitioning = true;
    currentSceneId = sceneId;

    await fadeToBlack();

    const scene = sceneId ? sceneMap.get(sceneId) ?? null : null;
    renderScene(scene);

    await fadeInFromBlack();

    isTransitioning = false;
  }

  eventSource.addEventListener("state_snapshot", (event) => {
    const data = JSON.parse(event.data);
    console.log("Initial state snapshot received:", data);
    currentState = data;
    renderState(currentState);
    switchScene(currentState.current_scene?.scene_id ?? null);
  });

  eventSource.addEventListener("scene_changed", (event) => {
    const data = JSON.parse(event.data);
    console.log("Scene changed:", data);
    applyStatePatch({
      current_scene: data.scene,
    });
    switchScene(data.scene?.scene_id ?? null);
  });

  eventSource.addEventListener("music_changed", (event) => {
    const data = JSON.parse(event.data);
    console.log("Music changed:", data);
    applyStatePatch({
      current_music_playlist: data.music_playlist,
    });
  });

  eventSource.addEventListener("ambience_changed", (event) => {
    const data = JSON.parse(event.data);
    console.log("Ambience changed:", data);
    applyStatePatch({
      active_ambiences: data.active_ambiences,
    });
  });

  eventSource.addEventListener("fade_settings_changed", (event) => {
    const data = JSON.parse(event.data);
    console.log("Fade settings changed:", data);
    applyStatePatch({
      fade_settings: data.fade_settings,
    });
  });

  eventSource.addEventListener("volume_changed", (event) => {
    const data = JSON.parse(event.data);
    console.log("Volume changed:", data);
    applyStatePatch({
      current_music_playlist: data.music_playlist ?? currentState.current_music_playlist,
      active_ambiences: data.active_ambiences ?? currentState.active_ambiences,
    });
  });

  eventSource.onerror = () => {
    console.warn("Display SSE connection lost. Browser will retry automatically.");
  };

  console.log("Display page loaded");
}

document.addEventListener("DOMContentLoaded", initDisplayPage);
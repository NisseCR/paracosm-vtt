/**
 * Dedicated preview script for the pop-out preview window.
 */
async function initPreview() {
  const sceneId = window.PREVIEW_SCENE_ID;
  const container = document.getElementById("scene-stage");

  if (!sceneId) {
    container.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center;">No scene ID provided</div>';
    return;
  }

  try {
    const response = await fetch(`/api/scenes/${sceneId}`);
    if (response.status === 404) {
      container.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center;">Scene not found</div>';
      return;
    }
    const scene = await response.json();

    const engine = new SceneEngine({
      container: container
    });

    engine.renderScene(scene);
  } catch (error) {
    console.error("Failed to load preview scene:", error);
    container.innerHTML = '<div style="display: flex; height: 100%; align-items: center; justify-content: center;">Failed to load preview</div>';
  }
}

document.addEventListener("DOMContentLoaded", initPreview);

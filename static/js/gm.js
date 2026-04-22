/**
 * Initialize the GM page behavior.
 *
 * This file will later manage tabs, scene selection, and audio controls.
 */
async function initGmPage() {
  console.log("GM page loaded");

  const [stateResponse, libraryResponse] = await Promise.all([
    fetch("/api/state"),
    fetch("/api/library"),
  ]);

  const currentState = await stateResponse.json();
  const library = await libraryResponse.json();

  console.log("Current state:", currentState);
  console.log("Library:", library);

  const sceneList = document.getElementById("scene-list");
  const musicList = document.getElementById("music-list");

  if (sceneList) {
    sceneList.innerHTML = "";
    library.scenes.forEach((scene) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = scene.name;
      button.addEventListener("click", () => {
        setScene(scene.id);
      });
      sceneList.appendChild(button);
    });
  }

  if (musicList) {
    musicList.innerHTML = "";
    library.music_playlists.forEach((playlist) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = playlist.name;
      button.addEventListener("click", () => {
        setMusic(playlist.id);
      });
      musicList.appendChild(button);
    });
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function setScene(sceneId) {
  const updatedState = await postJson("/api/state/scene", {
    scene_id: sceneId,
  });
  console.log("Scene updated:", updatedState);
}

async function setMusic(musicPlaylistId) {
  const updatedState = await postJson("/api/state/music", {
    music_playlist: musicPlaylistId,
  });
  console.log("Music updated:", updatedState);
}

document.addEventListener("DOMContentLoaded", initGmPage);
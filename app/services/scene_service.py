from pathlib import Path
from typing import Any

from app.models.library import SceneDefinition


class SceneService:
    """
    Handle scene discovery and scene metadata loading.

    Scene definitions come from a JSON file, while assets are stored under the
    static art directory.
    """

    def __init__(self, art_dir: Path, scenes_file: Path) -> None:
        self.art_dir = art_dir
        self.scenes_file = scenes_file

    def load_scenes(self) -> list[SceneDefinition]:
        """
        Load scene definitions from the configured JSON file.

        Scene asset paths are kept relative so scene files stay easy to write.

        Returns:
            A list of scene definitions, or an empty list if nothing is available.
        """
        if not self.scenes_file.exists():
            return []

        import json

        with self.scenes_file.open("r", encoding="utf-8") as file:
            raw_scenes: list[dict[str, Any]] = json.load(file)

        scenes: list[SceneDefinition] = []
        for scene in raw_scenes:
            scenes.append(
                SceneDefinition(
                    id=scene["id"],
                    name=scene["name"],
                    background=self._to_static_url(scene["background"]),
                    layers=[self._to_static_url(layer) for layer in scene.get("layers", [])],
                )
            )

        return scenes

    def _to_static_url(self, relative_path: str) -> str:
        """
        Convert an art-relative path into a static URL.

        Args:
            relative_path: A path relative to the art directory.

        Returns:
            A browser-accessible static URL.
        """
        return f"/static/art/{relative_path}".replace("\\", "/")
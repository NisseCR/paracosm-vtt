from pathlib import Path
from typing import Any

from app.models.library import SceneDefinition


class SceneService:
    """
    Handle scene discovery and scene metadata loading.

    Scene definitions come from a JSON file, while assets are stored under the
    static art directory.
    """

    IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
    VIDEO_EXTENSIONS = {".webm", ".mp4", ".mkv", ".mov", ".avi"}

    def __init__(self, images_dir: Path, video_dir: Path, scenes_file: Path) -> None:
        self.images_dir = images_dir
        self.video_dir = video_dir
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

    def _to_static_url(self, asset_name: str) -> str:
        """
        Convert an asset name into a static URL.

        Args:
            asset_name: A file name or relative asset path.

        Returns:
            A browser-accessible static URL.
        """
        normalized_name = asset_name.replace("\\", "/")

        if "/" in normalized_name:
            return f"/static/assets/{normalized_name}"

        suffix = Path(normalized_name).suffix.lower()

        if suffix in self.IMAGE_EXTENSIONS:
            return f"/static/assets/images/{normalized_name}"
        if suffix in self.VIDEO_EXTENSIONS:
            return f"/static/assets/video/{normalized_name}"

        return f"/static/assets/images/{normalized_name}"
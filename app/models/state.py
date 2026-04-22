from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class MusicTrack:
    """
    Represent a single music track discovered from the file system.
    """

    name: str
    file_name: str
    file_path: str
    url: str


@dataclass(slots=True)
class MusicPlaylist:
    """
    Represent a music playlist folder containing one or more tracks and cover art.
    """

    id: str
    name: str
    cover_url: str | None
    tracks: list[MusicTrack] = field(default_factory=list)


@dataclass(slots=True)
class AmbienceTrack:
    """
    Represent a single ambience file discovered from the file system.
    """

    name: str
    file_name: str
    file_path: str
    url: str


@dataclass(slots=True)
class AmbienceFolder:
    """
    Represent an ambience category folder containing one or more ambience files.
    """

    id: str
    name: str
    tracks: list[AmbienceTrack] = field(default_factory=list)


@dataclass(slots=True)
class SceneDefinition:
    """
    Represent a scene definition loaded from the scene JSON file.
    """

    id: str
    name: str
    background: str
    layers: list[str] = field(default_factory=list)


@dataclass
class AppState:
    """
    Shared in-memory application state.

    This holds the live selections and settings that will later be broadcast
    through SSE to the GM and display pages.
    """

    current_scene_id: str | None = None
    current_music_playlist: str | None = None
    active_ambiences: dict[str, float] = field(default_factory=dict)
    fade_settings: dict[str, Any] = field(
        default_factory=lambda: {
            "music": 5.0,
            "ambience": 10.0,
            "scene": 5.0,
        }
    )
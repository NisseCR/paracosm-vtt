from pydantic import BaseModel

from app.models.library import AmbienceFolder, MusicPlaylist, SceneDefinition
from app.models.state import AppState


class RootResponse(BaseModel):
    """
    Represent the basic root endpoint response.
    """

    name: str
    status: str
    routes: list[str]


class LibraryResponse(BaseModel):
    """
    Represent the discovered library payload returned to the UI.
    """

    music_playlists: list[MusicPlaylist]
    ambience_folders: list[AmbienceFolder]
    scenes: list[SceneDefinition]


class StateResponse(AppState):
    """
    Represent the public state payload returned to the UI.
    """

    pass
from pydantic import BaseModel


class SceneUpdateRequest(BaseModel):
    """
    Represent a request to change the current scene.
    """

    scene_id: str | None


class MusicUpdateRequest(BaseModel):
    """
    Represent a request to change the current music playlist.
    """

    music_playlist: str | None


class AmbienceUpdateRequest(BaseModel):
    """
    Represent a request to change the active ambience set.
    """

    active_ambiences: dict[str, float]


class FadeUpdateRequest(BaseModel):
    """
    Represent a request to change fade settings.
    """

    fade_settings: dict[str, float]


class ServerEvent(BaseModel):
    """
    Represent a server-sent event payload.

    This gives the GM and display pages a consistent message format for live
    updates.
    """

    type: str
    payload: dict
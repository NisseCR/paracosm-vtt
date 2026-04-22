from pydantic import BaseModel, Field


class MusicTrack(BaseModel):
    """
    Represent a single music track discovered from the file system.
    """

    name: str
    file_name: str
    file_path: str
    url: str


class MusicPlaylist(BaseModel):
    """
    Represent a music playlist folder containing one or more tracks and cover art.
    """

    id: str
    name: str
    cover_url: str | None = None
    tracks: list[MusicTrack] = Field(default_factory=list)


class AmbienceTrack(BaseModel):
    """
    Represent a single ambience file discovered from the file system.
    """

    name: str
    file_name: str
    file_path: str
    url: str


class AmbienceFolder(BaseModel):
    """
    Represent an ambience category folder containing one or more ambience files.
    """

    id: str
    name: str
    tracks: list[AmbienceTrack] = Field(default_factory=list)


class SceneDefinition(BaseModel):
    """
    Represent a scene definition loaded from the scene JSON file.
    """

    id: str
    name: str
    background: str
    layers: list[str] = Field(default_factory=list)
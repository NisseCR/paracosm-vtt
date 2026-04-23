from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.models.state import AppState
from app.services.audio_service import AudioService
from app.services.event_service import EventService
from app.services.scene_service import SceneService
from app.web.routes import router as web_router


def build_application_state(audio_service: AudioService, scene_service: SceneService) -> dict:
    """
    Build the initial application state payload stored on the FastAPI app.

    Args:
        audio_service: The audio library discovery service.
        scene_service: The scene library discovery service.

    Returns:
        A dictionary of app state resources and discovered media data.
    """
    return {
        "app_state": AppState(),
        "event_service": EventService(),
        "audio_service": audio_service,
        "scene_service": scene_service,
        "music_playlists": [playlist.model_dump() for playlist in audio_service.scan_music_playlists()],
        "ambience_folders": [folder.model_dump() for folder in audio_service.scan_ambience_folders()],
        "scenes": [scene.model_dump() for scene in scene_service.load_scenes()],
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Initialize and tear down application resources.

    This runs once when the app starts and once when the app shuts down.
    """
    audio_service = AudioService(settings.audio_dir)
    scene_service = SceneService(
        settings.images_dir,
        settings.video_dir,
        settings.scenes_file,
    )

    initial_state = build_application_state(audio_service, scene_service)
    for key, value in initial_state.items():
        setattr(app.state, key, value)

    yield


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.

    Returns:
        A fully configured FastAPI application.
    """
    app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

    app.include_router(web_router)

    if settings.static_dir.exists():
        app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")

    return app
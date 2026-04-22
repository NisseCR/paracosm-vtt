from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates

from app.core.config import settings

router = APIRouter()
templates = Jinja2Templates(directory=str(settings.templates_dir))


@router.get("/", response_class=JSONResponse)
async def root() -> dict:
    """
    Return a basic health-style response for the application root.

    Returns:
        A small JSON payload describing the application and available pages.
    """
    return {
        "name": settings.app_name,
        "status": "ok",
        "routes": ["/gm", "/display"],
    }


@router.get("/gm", response_class=HTMLResponse)
async def gm_page(request: Request) -> HTMLResponse:
    """
    Render the Game Master control page.

    Args:
        request: The active HTTP request.

    Returns:
        The rendered GM page HTML response.
    """
    return templates.TemplateResponse("gm.html", {"request": request})


@router.get("/display", response_class=HTMLResponse)
async def display_page(request: Request) -> HTMLResponse:
    """
    Render the display page used for the streamed output.

    Args:
        request: The active HTTP request.

    Returns:
        The rendered display page HTML response.
    """
    return templates.TemplateResponse("display.html", {"request": request})


@router.get("/api/state", response_class=JSONResponse)
async def get_state(request: Request) -> dict:
    """
    Return the current live application state.

    Args:
        request: The active HTTP request.

    Returns:
        A JSON object containing the shared app state.
    """
    state = request.app.state.app_state
    return {
        "current_scene_id": state.current_scene_id,
        "current_music_playlist": state.current_music_playlist,
        "active_ambiences": state.active_ambiences,
        "fade_settings": state.fade_settings,
    }


@router.get("/api/library", response_class=JSONResponse)
async def get_library(request: Request) -> dict:
    """
    Return the discovered scene and audio library data.

    Args:
        request: The active HTTP request.

    Returns:
        A JSON object containing music, ambience, and scene catalogs.
    """
    return {
        "music_playlists": request.app.state.music_playlists,
        "ambience_folders": request.app.state.ambience_folders,
        "scenes": request.app.state.scenes,
    }
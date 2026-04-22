from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.core.config import settings
from app.schemas.api import LibraryResponse, RootResponse, StateResponse

router = APIRouter()
templates = Jinja2Templates(directory=str(settings.templates_dir))


@router.get("/", response_model=RootResponse)
async def root() -> RootResponse:
    """
    Return a basic health-style response for the application root.

    Returns:
        A small payload describing the application and available pages.
    """
    return RootResponse(
        name=settings.app_name,
        status="ok",
        routes=["/gm", "/display"],
    )


@router.get("/gm", response_class=HTMLResponse)
async def gm_page(request: Request) -> HTMLResponse:
    """
    Render the Game Master control page.

    Args:
        request: The active HTTP request.

    Returns:
        The rendered GM page HTML response.
    """
    return templates.TemplateResponse(
        request=request,
        name="gm.html",
        context={},
    )


@router.get("/display", response_class=HTMLResponse)
async def display_page(request: Request) -> HTMLResponse:
    """
    Render the display page used for the streamed output.

    Args:
        request: The active HTTP request.

    Returns:
        The rendered display page HTML response.
    """
    return templates.TemplateResponse(
        request=request,
        name="display.html",
        context={},
    )


@router.get("/api/state", response_model=StateResponse)
async def get_state(request: Request) -> StateResponse:
    """
    Return the current live application state.

    Args:
        request: The active HTTP request.

    Returns:
        The shared app state.
    """
    return request.app.state.app_state


@router.get("/api/library", response_model=LibraryResponse)
async def get_library(request: Request) -> LibraryResponse:
    """
    Return the discovered scene and audio library data.

    Args:
        request: The active HTTP request.

    Returns:
        The music, ambience, and scene catalogs.
    """
    return LibraryResponse(
        music_playlists=request.app.state.music_playlists,
        ambience_folders=request.app.state.ambience_folders,
        scenes=request.app.state.scenes,
    )
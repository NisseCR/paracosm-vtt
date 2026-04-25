import pytest
from fastapi.testclient import TestClient
from app.main import create_app

@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c

def test_music_track_order_schema(client):
    # Sync with track_order
    sync_payload = {
        "scene": None,
        "music": {
            "playlist_id": "test-playlist",
            "track_order": ["url1.mp3", "url2.mp3", "url3.mp3"]
        },
        "ambiences": {},
        "show_debug": True,
        "fade_settings": {"music": 5.0, "ambience": 5.0, "scene": 5.0},
        "volume_settings": {"music": 1.0, "ambience": 1.0}
    }
    
    response = client.post("/api/state/sync", json=sync_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["music"]["playlist_id"] == "test-playlist"
    assert data["music"]["track_order"] == ["url1.mp3", "url2.mp3", "url3.mp3"]

    # Verify state persistence
    response = client.get("/api/state")
    assert response.status_code == 200
    data = response.json()
    assert data["music"]["track_order"] == ["url1.mp3", "url2.mp3", "url3.mp3"]

def test_music_track_order_backward_compatibility(client):
    # Sync WITHOUT track_order
    sync_payload = {
        "scene": None,
        "music": {
            "playlist_id": "test-playlist"
        },
        "ambiences": {},
        "show_debug": True,
        "fade_settings": {"music": 5.0, "ambience": 5.0, "scene": 5.0},
        "volume_settings": {"music": 1.0, "ambience": 1.0}
    }
    
    response = client.post("/api/state/sync", json=sync_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["music"]["playlist_id"] == "test-playlist"
    # track_order should be an empty list by default
    assert data["music"]["track_order"] == []

import pytest
from fastapi.testclient import TestClient
from app.main import create_app

@pytest.fixture
def client():
    app = create_app()
    with TestClient(app) as c:
        yield c

def test_state_sync_with_volumes(client):
    # Initial state
    response = client.get("/api/state")
    assert response.status_code == 200
    data = response.json()
    assert "volume_settings" in data
    assert data["volume_settings"]["music"] == 1.0
    assert data["volume_settings"]["ambience"] == 1.0

    # Sync with new volumes
    sync_payload = {
        "scene": None,
        "music": {"playlist_id": "test-playlist"},
        "ambiences": {"test-ambience": {"ambience_id": "test-ambience"}},
        "show_debug": True,
        "fade_settings": {"music": 5.0, "ambience": 5.0, "scene": 5.0},
        "volume_settings": {"music": 0.5, "ambience": 0.7}
    }
    
    response = client.post("/api/state/sync", json=sync_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["volume_settings"]["music"] == 0.5
    assert data["volume_settings"]["ambience"] == 0.7
    
    # Assert per-channel volume is NOT in the response
    assert "volume" not in data["music"]
    assert "volume" not in data["ambiences"]["test-ambience"]

    # Verify state persistence
    response = client.get("/api/state")
    assert response.status_code == 200
    data = response.json()
    assert data["volume_settings"]["music"] == 0.5
    assert data["volume_settings"]["ambience"] == 0.7
    assert "volume" not in data["music"]
    assert "volume" not in data["ambiences"]["test-ambience"]

def test_state_sync_backward_compatibility(client):
    # Sync WITHOUT volume_settings (simulating older client)
    # Also include old per-channel volume fields to ensure they are ignored/stripped
    sync_payload = {
        "scene": None,
        "music": {"playlist_id": "test-playlist", "volume": 0.2},
        "ambiences": {"test-ambience": {"ambience_id": "test-ambience", "volume": 0.3}},
        "show_debug": True,
        "fade_settings": {"music": 5.0, "ambience": 5.0, "scene": 5.0}
    }
    
    response = client.post("/api/state/sync", json=sync_payload)
    assert response.status_code == 200
    data = response.json()
    # Should fall back to defaults
    assert "volume_settings" in data
    assert data["volume_settings"]["music"] == 1.0
    assert data["volume_settings"]["ambience"] == 1.0
    
    # Assert old per-channel volume fields are stripped
    assert "volume" not in data["music"]
    assert "volume" not in data["ambiences"]["test-ambience"]

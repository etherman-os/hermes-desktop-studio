"""Tests for /studio/artifacts routes."""

from __future__ import annotations

from fastapi.testclient import TestClient

from hermes_adapter.security import set_auth_token
from hermes_adapter.server import create_app

HEADERS = {"Authorization": "Bearer artifact-token"}


def _client() -> TestClient:
    set_auth_token("artifact-token")
    return TestClient(create_app())


def test_artifact_lifecycle_routes() -> None:
    client = _client()

    created = client.post(
        "/studio/artifacts",
        headers=HEADERS,
        json={
            "title": "Run report",
            "type": "markdown",
            "content_text": "# Run Summary\nDone",
            "run_id": "run-1",
            "source": "run",
        },
    )
    assert created.status_code == 200
    artifact = created.json()
    assert artifact["title"] == "Run report"
    assert artifact["run_id"] == "run-1"

    listed = client.get("/studio/artifacts", headers=HEADERS)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert "content_text" not in listed.json()["artifacts"][0]

    detail = client.get(f"/studio/artifacts/{artifact['id']}", headers=HEADERS)
    assert detail.status_code == 200
    assert detail.json()["content_text"] == "# Run Summary\nDone"

    patched = client.patch(
        f"/studio/artifacts/{artifact['id']}",
        headers=HEADERS,
        json={"title": "Updated report", "type": "report"},
    )
    assert patched.status_code == 200
    assert patched.json()["title"] == "Updated report"
    assert patched.json()["type"] == "report"

    linked_session = client.post(
        f"/studio/artifacts/{artifact['id']}/link-session",
        headers=HEADERS,
        json={"session_id": "session-1"},
    )
    assert linked_session.status_code == 200
    assert linked_session.json()["session_id"] == "session-1"

    linked_card = client.post(
        f"/studio/artifacts/{artifact['id']}/link-card",
        headers=HEADERS,
        json={"kanban_card_id": "card-1"},
    )
    assert linked_card.status_code == 200
    assert linked_card.json()["kanban_card_id"] == "card-1"

    archived = client.post(f"/studio/artifacts/{artifact['id']}/archive", headers=HEADERS)
    assert archived.status_code == 200
    assert archived.json()["archived_at"] is not None


def test_artifact_routes_support_filters() -> None:
    client = _client()
    client.post(
        "/studio/artifacts",
        headers=HEADERS,
        json={"title": "Session note", "type": "text", "session_id": "session-1", "source": "session"},
    )

    resp = client.get("/studio/artifacts?type=text&session_id=session-1&search=Session", headers=HEADERS)

    assert resp.status_code == 200
    assert resp.json()["total"] == 1
    assert resp.json()["artifacts"][0]["session_id"] == "session-1"


def test_artifact_routes_require_auth() -> None:
    client = _client()

    resp = client.get("/studio/artifacts")

    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "auth_missing"


def test_artifact_route_errors_use_standard_envelope() -> None:
    client = _client()

    resp = client.post("/studio/artifacts", headers=HEADERS, json={"title": "x" * 201})

    assert resp.status_code == 400
    error = resp.json()["error"]
    assert error["code"] == "artifact_error"
    assert error["source"] == "studio"
    assert "title" in error["message"]

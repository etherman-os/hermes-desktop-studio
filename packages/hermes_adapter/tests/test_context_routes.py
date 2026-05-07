"""Tests for /studio/context/* routes."""

from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from hermes_adapter import studio_routes
from hermes_adapter.approval_repository import ApprovalRepository
from hermes_adapter.artifact_repository import ArtifactRepository
from hermes_adapter.kanban_repository import KanbanRepository
from hermes_adapter.run_ledger_repository import RunLedgerRepository
from hermes_adapter.security import set_auth_token
from hermes_adapter.server import create_app
from hermes_adapter.studio_storage import StudioStorage

HEADERS = {"Authorization": "Bearer context-token"}


@pytest.fixture(autouse=True)
def _set_mock_backend(monkeypatch: pytest.MonkeyPatch) -> None:
    """Keep context route tests deterministic and isolated from local Hermes."""
    monkeypatch.setenv("HERMES_STUDIO_BACKEND", "mock")
    studio_routes._backend = None
    studio_routes._backend_status = {}
    set_auth_token("context-token")


@pytest.fixture()
def client() -> TestClient:
    return TestClient(create_app())


def test_current_context_route_returns_profile_model_and_storage(client: TestClient, tmp_path: Path) -> None:
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    (workspace / "AGENTS.md").write_text("Use focused changes only.", encoding="utf-8")

    resp = client.get(
        "/studio/context/current",
        params={"workspace_path": str(workspace)},
        headers=HEADERS,
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "current"
    assert data["active_profile"]["name"] == "coder"
    assert data["model"]["model"] == "claude-sonnet-4-20250514"
    assert data["storage"]["available"] is True
    assert data["workspace"]["available"] is True
    agents = next(item for item in data["context_files"]["items"] if item["name"] == "AGENTS.md")
    assert agents["available"] is True
    assert "focused changes" in agents["preview"]


def test_run_context_route_includes_run_metadata_and_related_work(client: TestClient, tmp_path: Path) -> None:
    workspace = tmp_path / "repo"
    workspace.mkdir()
    storage = StudioStorage()
    RunLedgerRepository(storage).create_run(
        run_id="route-run",
        session_id="s-1",
        status="completed",
        prompt="Route run",
        backend="mock",
        model="mock-model",
        workspace_path=str(workspace),
    )
    ArtifactRepository(storage).create_artifact({"title": "Route artifact", "type": "markdown", "run_id": "route-run"})
    KanbanRepository(storage).create_card({"title": "Route card", "run_id": "route-run"})
    ApprovalRepository(storage).record_approval_requested(
        {
            "id": "evt-route-approval",
            "type": "approval.requested",
            "run_id": "route-run",
            "session_id": "s-1",
            "timestamp": "2026-05-07T00:00:00Z",
            "source": "adapter",
            "payload": {"approval_id": "route-approval", "tool": "shell", "action": "pytest", "risk_level": "high"},
        }
    )

    resp = client.get("/studio/context/runs/route-run", headers=HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "run"
    assert data["run"]["id"] == "route-run"
    assert data["workspace"]["name"] == "repo"
    assert data["session"]["id"] == "s-1"
    assert data["related"]["artifacts"][0]["title"] == "Route artifact"
    assert data["related"]["kanban_cards"][0]["title"] == "Route card"
    assert data["related"]["approvals"][0]["id"] == "route-approval"


def test_session_context_route_includes_session_and_related_runs(client: TestClient) -> None:
    RunLedgerRepository(StudioStorage()).create_run(
        run_id="session-route-run",
        session_id="s-1",
        status="completed",
        prompt="Session route run",
        backend="mock",
    )

    resp = client.get("/studio/context/sessions/s-1", headers=HEADERS)

    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "session"
    assert data["session"]["id"] == "s-1"
    assert data["related"]["runs"][0]["id"] == "session-route-run"


def test_workspace_context_route_rejects_traversal_without_crashing(client: TestClient, tmp_path: Path) -> None:
    resp = client.get(
        "/studio/context/workspaces/current",
        params={"workspace_path": str(tmp_path / "workspace" / ".." / "other")},
        headers=HEADERS,
    )

    assert resp.status_code == 200
    data = resp.json()
    assert data["scope"] == "workspace"
    assert data["workspace"]["available"] is False
    assert any("rejected" in warning for warning in data["warnings"])


def test_context_routes_require_auth(client: TestClient) -> None:
    resp = client.get("/studio/context/current")

    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "auth_missing"

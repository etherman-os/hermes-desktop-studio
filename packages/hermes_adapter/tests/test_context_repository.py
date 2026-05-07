"""Tests for read-only Context Inspector aggregation."""

from __future__ import annotations

import sqlite3
from pathlib import Path

import pytest

from hermes_adapter.artifact_repository import ArtifactRepository
from hermes_adapter.context_repository import ContextRepository
from hermes_adapter.kanban_repository import KanbanRepository
from hermes_adapter.mock_backend import MockBackend
from hermes_adapter.run_ledger_repository import RunLedgerRepository
from hermes_adapter.studio_storage import StudioStorage


@pytest.mark.asyncio
async def test_current_context_returns_profile_model_and_storage(tmp_path: Path) -> None:
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    storage = StudioStorage(data_dir=tmp_path / "studio-data")

    snapshot = await ContextRepository(storage).current(MockBackend(), {"backend_mode": "mock"}, workspace_path=str(workspace))

    assert snapshot["scope"] == "current"
    assert snapshot["active_profile"]["name"] == "coder"
    assert snapshot["model"]["model"] == "claude-sonnet-4-20250514"
    assert snapshot["storage"]["available"] is True
    assert snapshot["workspace"]["available"] is True


@pytest.mark.asyncio
async def test_run_context_includes_run_related_artifacts_and_cards(tmp_path: Path) -> None:
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    storage = StudioStorage(data_dir=tmp_path / "studio-data")
    RunLedgerRepository(storage).create_run(
        run_id="run-1",
        session_id="s-1",
        status="completed",
        prompt="Explain failure",
        backend="mock",
        model="mock-model",
        workspace_path=str(workspace),
    )
    ArtifactRepository(storage).create_artifact({"title": "Run report", "type": "markdown", "run_id": "run-1"})
    KanbanRepository(storage).create_card({"title": "Follow up", "run_id": "run-1"})

    snapshot = await ContextRepository(storage).for_run(MockBackend(), {"backend_mode": "mock"}, "run-1")

    assert snapshot["scope"] == "run"
    assert snapshot["run"]["id"] == "run-1"
    assert snapshot["workspace"]["name"] == "workspace"
    assert snapshot["related"]["artifacts"][0]["title"] == "Run report"
    assert snapshot["related"]["kanban_cards"][0]["title"] == "Follow up"


@pytest.mark.asyncio
async def test_session_context_includes_session_and_related_runs(tmp_path: Path) -> None:
    storage = StudioStorage(data_dir=tmp_path / "studio-data")
    RunLedgerRepository(storage).create_run(
        run_id="run-1",
        session_id="s-1",
        status="completed",
        prompt="Session run",
        backend="mock",
    )

    snapshot = await ContextRepository(storage).for_session(MockBackend(), {"backend_mode": "mock"}, "s-1")

    assert snapshot["scope"] == "session"
    assert snapshot["session"]["id"] == "s-1"
    assert snapshot["related"]["runs"][0]["id"] == "run-1"


@pytest.mark.asyncio
async def test_missing_workspace_does_not_crash(tmp_path: Path) -> None:
    storage = StudioStorage(data_dir=tmp_path / "studio-data")

    snapshot = await ContextRepository(storage).current(MockBackend(), {"backend_mode": "mock"})

    assert snapshot["workspace"]["available"] is False
    assert snapshot["context_files"]["items"][0]["available"] is False
    assert any("No workspace path selected" in warning for warning in snapshot["warnings"])


@pytest.mark.asyncio
async def test_context_file_preview_is_limited_and_redacted(tmp_path: Path) -> None:
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    (workspace / "SOUL.md").write_text("api_key=sk-secret\n" + ("x" * 3000), encoding="utf-8")
    storage = StudioStorage(data_dir=tmp_path / "studio-data")

    snapshot = await ContextRepository(storage).current(MockBackend(), {"backend_mode": "mock"}, workspace_path=str(workspace))
    soul = next(item for item in snapshot["context_files"]["items"] if item["name"] == "SOUL.md")

    assert soul["available"] is True
    assert "sk-secret" not in soul["preview"]
    assert "[REDACTED]" in soul["preview"]
    assert len(soul["preview"]) < 1700


@pytest.mark.asyncio
async def test_context_file_symlinks_are_skipped(tmp_path: Path) -> None:
    workspace = tmp_path / "workspace"
    workspace.mkdir()
    outside = tmp_path / "outside.md"
    outside.write_text("do not read through symlink", encoding="utf-8")
    (workspace / "AGENTS.md").symlink_to(outside)
    storage = StudioStorage(data_dir=tmp_path / "studio-data")

    snapshot = await ContextRepository(storage).current(MockBackend(), {"backend_mode": "mock"}, workspace_path=str(workspace))
    agents = next(item for item in snapshot["context_files"]["items"] if item["name"] == "AGENTS.md")

    assert agents["available"] is False
    assert "Symlink" in agents["warning"]
    assert any("symlink" in warning for warning in snapshot["context_files"]["warnings"])


@pytest.mark.asyncio
async def test_unsafe_workspace_path_is_rejected(tmp_path: Path) -> None:
    storage = StudioStorage(data_dir=tmp_path / "studio-data")

    snapshot = await ContextRepository(storage).current(
        MockBackend(),
        {"backend_mode": "mock"},
        workspace_path=str(tmp_path / "workspace" / ".." / "other"),
    )

    assert snapshot["workspace"]["available"] is False
    assert any("rejected" in warning for warning in snapshot["warnings"])


@pytest.mark.asyncio
async def test_context_repository_does_not_write_to_hermes_state_db(tmp_path: Path) -> None:
    hermes_home = tmp_path / ".hermes"
    hermes_home.mkdir()
    hermes_db = hermes_home / "state.db"
    with sqlite3.connect(hermes_db) as conn:
        conn.execute("CREATE TABLE hermes_marker (id INTEGER PRIMARY KEY)")
        conn.execute("INSERT INTO hermes_marker (id) VALUES (1)")

    before = hermes_db.read_bytes()
    storage = StudioStorage(data_dir=tmp_path / "studio-data")
    await ContextRepository(storage).current(MockBackend(), {"backend_mode": "mock"})
    after = hermes_db.read_bytes()

    assert before == after

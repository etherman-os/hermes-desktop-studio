"""Tests for Studio-owned run ledger persistence."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any

from hermes_adapter.run_ledger_repository import RunLedgerRepository
from hermes_adapter.studio_events import make_studio_event
from hermes_adapter.studio_storage import StudioStorage


def _repo(tmp_path: Path) -> RunLedgerRepository:
    return RunLedgerRepository(StudioStorage(data_dir=tmp_path / "studio-data"))


def _event(event_type: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    return make_studio_event(event_type, payload or {}, source="hermes", run_id="run-1", session_id="session-1")


def test_create_run_record(tmp_path: Path) -> None:
    run = _repo(tmp_path).create_run(
        run_id="run-1",
        session_id="session-1",
        status="started",
        prompt="Map the repository structure",
        backend="mock",
        model="mock-model",
        workspace_path="/work/project",
    )

    assert run["id"] == "run-1"
    assert run["session_id"] == "session-1"
    assert run["status"] == "running"
    assert run["title"] == "Map the repository structure"
    assert run["backend"] == "mock"
    assert run["model"] == "mock-model"
    assert run["workspace_path"] == "/work/project"


def test_append_run_events_and_load_ledger(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    repo.create_run(
        run_id="run-1",
        session_id="session-1",
        status="started",
        prompt="Check tests",
        backend="mock",
    )

    repo.append_event("run-1", _event("run.started", {"run_id": "run-1", "session_id": "session-1"}))
    repo.append_event("run-1", _event("assistant.delta", {"text": "Done"}))
    repo.append_event("run-1", _event("run.completed", {"run_id": "run-1", "duration_ms": 42}))

    ledger = repo.get_ledger("run-1")

    assert ledger["run"]["status"] == "completed"
    assert ledger["run"]["duration_ms"] == 42
    assert [event["type"] for event in ledger["events"]] == [
        "run.started",
        "assistant.delta",
        "run.completed",
    ]


def test_load_recent_runs(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    repo.create_run(run_id="run-1", session_id=None, status="started", prompt="First", backend="mock")
    repo.create_run(run_id="run-2", session_id=None, status="started", prompt="Second", backend="mock")

    recent = repo.get_recent_runs(limit=10)

    assert recent["history_available"] is True
    assert recent["total"] == 2
    assert [run["id"] for run in recent["runs"]] == ["run-2", "run-1"]


def test_append_event_creates_missing_run(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    repo.append_event("run-missing", make_studio_event("run.failed", {"message": "Missing"}, run_id="run-missing"))

    run = repo.get_run("run-missing")

    assert run["status"] == "failed"
    assert run["error"] == "Missing"


def test_run_ledger_redacts_secret_payloads(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    repo.create_run(
        run_id="run-1",
        session_id=None,
        status="started",
        prompt="Use Bearer abcdef0123456789abcdef0123456789",
        backend="mock",
    )
    repo.append_event(
        "run-1",
        _event(
            "tool.started",
            {
                "tool": "env",
                "api_key": "sk-abcdef0123456789",
                "message": "Bearer abcdef0123456789abcdef0123456789",
            },
        ),
    )

    ledger = repo.get_ledger("run-1")
    payload = ledger["events"][0]["payload"]

    assert repo.get_run("run-1")["prompt_preview"] == "Use [redacted]"
    assert payload["api_key"] == "[redacted]"
    assert payload["message"] == "[redacted]"


def test_run_ledger_repository_does_not_write_to_hermes_state_db(tmp_path: Path) -> None:
    hermes_home = tmp_path / ".hermes"
    hermes_home.mkdir()
    hermes_db = hermes_home / "state.db"
    with sqlite3.connect(hermes_db) as conn:
        conn.execute("CREATE TABLE hermes_marker (id INTEGER PRIMARY KEY)")
        conn.execute("INSERT INTO hermes_marker (id) VALUES (1)")

    before = hermes_db.read_bytes()
    repo = RunLedgerRepository(StudioStorage(data_dir=tmp_path / "studio-data"))
    repo.create_run(run_id="run-1", session_id=None, status="started", prompt="Studio-only run", backend="mock")
    repo.append_event("run-1", _event("run.completed", {"run_id": "run-1"}))
    after = hermes_db.read_bytes()

    assert before == after
    with sqlite3.connect(hermes_db) as conn:
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
        }
    assert tables == {"hermes_marker"}

"""Tests for Studio-owned approval persistence."""

from __future__ import annotations

import sqlite3
from pathlib import Path

from hermes_adapter.approval_repository import ApprovalRepository
from hermes_adapter.studio_events import make_studio_event
from hermes_adapter.studio_storage import StudioStorage


def _repo(tmp_path: Path) -> ApprovalRepository:
    return ApprovalRepository(StudioStorage(data_dir=tmp_path / "studio-data"))


def test_record_approval_requested(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    event = make_studio_event(
        "approval.requested",
        {
            "approval_id": "approval-1",
            "tool": "shell",
            "action": "rm -rf build",
            "risk_level": "high",
            "reason": "Deletes generated files only",
        },
        run_id="run-1",
        session_id="s-1",
    )

    approval = repo.record_approval_requested(event)

    assert approval["id"] == "approval-1"
    assert approval["run_id"] == "run-1"
    assert approval["session_id"] == "s-1"
    assert approval["tool_name"] == "shell"
    assert approval["command"] == "rm -rf build"
    assert approval["risk_level"] == "high"
    assert approval["status"] == "pending"
    assert approval["request_payload"]["approval_id"] == "approval-1"


def test_record_approval_resolved(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    repo.record_approval_requested(
        make_studio_event(
            "approval.requested",
            {"approval_id": "approval-1", "tool": "shell", "action": "pytest"},
            run_id="run-1",
            session_id="s-1",
        )
    )

    resolved = repo.record_approval_resolved(
        make_studio_event(
            "approval.resolved",
            {"approval_id": "approval-1", "decision": "denied"},
            run_id="run-1",
            session_id="s-1",
        )
    )
    detail = repo.get_approval("approval-1")

    assert resolved["status"] == "denied"
    assert resolved["decision"] == "denied"
    assert resolved["decided_at"] is not None
    assert [event["type"] for event in detail["events"]] == ["approval.requested", "approval.resolved"]


def test_list_pending_and_scope_filters(tmp_path: Path) -> None:
    repo = _repo(tmp_path)
    repo.record_approval_requested(
        make_studio_event("approval.requested", {"approval_id": "a-run", "tool": "shell"}, run_id="run-1")
    )
    repo.record_approval_requested(
        make_studio_event("approval.requested", {"approval_id": "a-session", "tool": "edit"}, session_id="s-1")
    )
    repo.record_approval_resolved(
        make_studio_event("approval.resolved", {"approval_id": "a-session", "decision": "approved"}, session_id="s-1")
    )

    pending = repo.list_pending_approvals()
    run_items = repo.list_approvals_for_run("run-1")
    session_items = repo.list_approvals_for_session("s-1")

    assert {item["id"] for item in pending["approvals"]} == {"a-run"}
    assert run_items["approvals"][0]["id"] == "a-run"
    assert session_items["approvals"][0]["id"] == "a-session"


def test_redacts_secret_like_payloads(tmp_path: Path) -> None:
    repo = _repo(tmp_path)

    approval = repo.record_approval_requested(
        make_studio_event(
            "approval.requested",
            {
                "approval_id": "approval-secret",
                "tool": "shell",
                "action": "curl",
                "reason": "Authorization: Bearer abc123",
                "api_key": "sk-secretvalue",
            },
        )
    )

    payload = approval["request_payload"]
    assert "Bearer abc123" not in payload["reason"]
    assert payload["api_key"] == "[REDACTED]"


def test_malformed_approval_payload_does_not_crash(tmp_path: Path) -> None:
    repo = _repo(tmp_path)

    approval = repo.record_approval_requested({"id": "evt-malformed", "type": "approval.requested", "payload": "raw"})

    assert approval["id"] == "evt-malformed"
    assert approval["status"] == "pending"
    assert approval["tool_name"] is None
    assert approval["risk_level"] == "unknown"
    assert approval["request_payload"] == {"value": "raw"}


def test_approval_repository_does_not_write_to_hermes_state_db(tmp_path: Path) -> None:
    hermes_home = tmp_path / ".hermes"
    hermes_home.mkdir()
    hermes_db = hermes_home / "state.db"
    with sqlite3.connect(hermes_db) as conn:
        conn.execute("CREATE TABLE hermes_marker (id INTEGER PRIMARY KEY)")
        conn.execute("INSERT INTO hermes_marker (id) VALUES (1)")

    before = hermes_db.read_bytes()
    repo = ApprovalRepository(StudioStorage(data_dir=tmp_path / "studio-data"))
    repo.record_approval_requested(
        make_studio_event("approval.requested", {"approval_id": "studio-only", "tool": "shell"}, run_id="run-1")
    )
    after = hermes_db.read_bytes()

    assert before == after
    with sqlite3.connect(hermes_db) as conn:
        tables = {
            row[0]
            for row in conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
        }
    assert tables == {"hermes_marker"}

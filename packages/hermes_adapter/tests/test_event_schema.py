"""Schema validation tests for Studio event emitters."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest
from jsonschema import Draft202012Validator, FormatChecker

from hermes_adapter import mock_backend
from hermes_adapter.event_normalizer import normalize_hermes_event
from hermes_adapter.hermes_backend import _normalize_hermes_event
from hermes_adapter.mock_backend import MockBackend

SCHEMA_PATH = Path(__file__).resolve().parents[2] / "protocol" / "events.schema.json"
FIXTURE_PATH = Path(__file__).parent / "fixtures" / "hermes_sse_sample.jsonl"
VALIDATOR = Draft202012Validator(
    json.loads(SCHEMA_PATH.read_text(encoding="utf-8")),
    format_checker=FormatChecker(),
)


def assert_valid_event(event: dict[str, Any]) -> None:
    errors = sorted(VALIDATOR.iter_errors(event), key=lambda err: err.path)
    assert errors == [], "; ".join(error.message for error in errors)


@pytest.mark.asyncio
async def test_mock_backend_run_events_validate_against_schema(monkeypatch: pytest.MonkeyPatch) -> None:
    async def no_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr(mock_backend.asyncio, "sleep", no_sleep)

    backend = MockBackend()
    run = await backend.start_run("s-1", "hello")

    events: list[dict[str, Any]] = []
    async for event in backend.stream_run_events(run["run_id"]):
        assert_valid_event(event)
        events.append(event)

    assert events[-1]["type"] == "run.completed"


def test_hermes_fixture_replay_events_validate_against_schema() -> None:
    with FIXTURE_PATH.open(encoding="utf-8") as fixture:
        for line in fixture:
            if not line.strip():
                continue
            entry = json.loads(line)
            raw = entry.get("data", {})
            raw["type"] = entry.get("event", raw.get("type", "unknown"))
            assert_valid_event(_normalize_hermes_event(raw))


def test_unknown_events_validate_as_adapter_warning() -> None:
    hermes_event = _normalize_hermes_event({"type": "future.event", "payload": {"x": 1}})
    adapter_event = normalize_hermes_event({"type": "future.event", "payload": {"x": 1}})

    assert hermes_event["type"] == "adapter.warning"
    assert adapter_event["type"] == "adapter.warning"
    assert_valid_event(hermes_event)
    assert_valid_event(adapter_event)

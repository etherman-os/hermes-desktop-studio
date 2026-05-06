"""Fixture replay test — replay captured Hermes SSE through normalizer."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from hermes_adapter.hermes_backend import _normalize_hermes_event

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "hermes_sse_sample.jsonl"


class TestFixtureReplay:
    def test_fixture_exists(self) -> None:
        assert FIXTURE_PATH.exists(), f"Fixture not found: {FIXTURE_PATH}"

    def test_fixture_replay_no_crash(self) -> None:
        """Replay all fixture events through normalizer. Must not crash."""
        events = []
        with open(FIXTURE_PATH) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                entry = json.loads(line)
                raw = entry.get("data", {})
                raw["type"] = entry.get("event", raw.get("type", "unknown"))
                normalized = _normalize_hermes_event(raw)
                events.append(normalized)

        assert len(events) > 0, "No events in fixture"

    def test_fixture_produces_expected_events(self) -> None:
        """Fixture should produce at least assistant.delta or run.completed."""
        events = []
        with open(FIXTURE_PATH) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                entry = json.loads(line)
                raw = entry.get("data", {})
                raw["type"] = entry.get("event", raw.get("type", "unknown"))
                normalized = _normalize_hermes_event(raw)
                events.append(normalized)

        types = {e["type"] for e in events}
        assert "assistant.delta" in types or "run.completed" in types, f"Unexpected types: {types}"

    def test_fixture_unknown_events_become_adapter_warning(self) -> None:
        """Unknown event types should become adapter.warning."""
        raw = {"type": "completely.unknown.event.type", "payload": {"data": "test"}}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "adapter.warning"
        assert "unknown" in result["payload"]["message"].lower()

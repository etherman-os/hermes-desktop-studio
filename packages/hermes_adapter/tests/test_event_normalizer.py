"""Tests for Hermes event normalization and terminal-state detection."""

import pytest

from hermes_adapter.event_normalizer import (
    KNOWN_TYPES,
    is_terminal_event,
    normalize_hermes_event,
)


class TestNormalizeHermesEvent:
    @pytest.mark.parametrize("event_type", list(KNOWN_TYPES))
    def test_known_events_passthrough(self, event_type: str) -> None:
        raw = {"type": event_type, "payload": {"x": 1}, "source": "hermes"}
        normalized = normalize_hermes_event(raw)

        assert normalized["type"] == event_type
        assert normalized["payload"] == {"x": 1}
        assert normalized["source"] == "hermes"

    def test_run_completed_ok(self, sample_run_completed_ok_event: dict) -> None:
        normalized = normalize_hermes_event(sample_run_completed_ok_event)
        assert normalized["type"] == "run.completed"
        assert normalized["payload"]["status"] == "ok"

    def test_run_completed_failure_becomes_run_failed(
        self, sample_run_completed_failure_event: dict
    ) -> None:
        normalized = normalize_hermes_event(sample_run_completed_failure_event)
        assert normalized["type"] == "run.failed"
        assert normalized["payload"]["error"] == "Oops"

    def test_run_completed_with_error_field(self) -> None:
        raw = {
            "type": "run.completed",
            "payload": {"status": "ok", "error": "something"},
            "source": "hermes",
        }
        normalized = normalize_hermes_event(raw)
        assert normalized["type"] == "run.failed"

    def test_unknown_event_becomes_adapter_warning(self, sample_unknown_event: dict) -> None:
        normalized = normalize_hermes_event(sample_unknown_event)
        assert normalized["type"] == "adapter.warning"
        assert "Unknown event type" in normalized["payload"]["message"]
        assert normalized["payload"]["original_type"] == sample_unknown_event["type"]
        assert normalized["source"] == "adapter"

    def test_missing_type_becomes_adapter_warning(self) -> None:
        raw = {"payload": {}}
        normalized = normalize_hermes_event(raw)
        assert normalized["type"] == "adapter.warning"

    def test_default_source_is_hermes(self) -> None:
        raw = {"type": "assistant.delta", "payload": {}}
        normalized = normalize_hermes_event(raw)
        assert normalized["source"] == "hermes"


class TestIsTerminalEvent:
    @pytest.mark.parametrize(
        "event_type,expected",
        [
            ("run.completed", True),
            ("run.failed", True),
            ("run.cancelled", True),
            ("run.started", False),
            ("assistant.delta", False),
            ("tool.progress", False),
            ("adapter.warning", False),
        ],
    )
    def test_terminal_detection(self, event_type: str, expected: bool) -> None:
        assert is_terminal_event(event_type) is expected

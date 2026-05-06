"""Event normalizer for Hermes SSE events."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from hermes_adapter.models import ShellEvent, ShellEventType

TERMINAL_EVENTS: set[ShellEventType] = {
    "run.completed",
    "run.failed",
    "run.cancelled",
}


def normalize_hermes_event(raw: dict[str, Any]) -> ShellEvent:
    """Convert a raw Hermes-style SSE event into a normalized ShellEvent.

    Args:
        raw: Dictionary representing the raw event payload from Hermes.

    Returns:
        A normalized ShellEvent with a known type and timestamp.
    """
    event_type = raw.get("type", "adapter.warning")
    payload = raw.get("payload", {})
    timestamp_raw = raw.get("timestamp")

    if event_type == "run.completed" and payload.get("status") == "failed":
        event_type = "run.failed"
        payload = {
            **payload,
            "reason": payload.get("reason", "Hermes indicated failure on completion"),
        }

    timestamp = (
        datetime.fromisoformat(timestamp_raw)
        if isinstance(timestamp_raw, str)
        else datetime.now(UTC)
    )

    return ShellEvent(
        type=event_type,
        payload=payload,
        timestamp=timestamp,
    )


def is_terminal_event(event: ShellEvent) -> bool:
    """Return True if the event signals the end of a run stream."""
    return event.type in TERMINAL_EVENTS

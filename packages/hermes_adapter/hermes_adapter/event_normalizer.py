"""Hermes event normalizer — defensive mapping from raw Hermes SSE events to stable shell events."""

from typing import Any

TERMINAL_EVENTS = {
    "run.completed",
    "run.failed",
    "run.cancelled",
}

KNOWN_TYPES = {
    "run.started",
    "assistant.delta",
    "assistant.completed",
    "tool.started",
    "tool.progress",
    "tool.completed",
    "approval.requested",
    "approval.resolved",
    "run.completed",
    "run.failed",
    "run.cancelled",
    "log.line",
}


def normalize_hermes_event(raw_event: dict[str, Any]) -> dict[str, Any]:
    """Normalize a raw Hermes event into the adapter's stable event schema."""
    event_type = raw_event.get("type", "")
    source = raw_event.get("source", "hermes")
    payload = raw_event.get("payload", {})

    # Defensive: upstream sometimes signals failure inside run.completed
    if event_type == "run.completed":
        if payload.get("status") == "failed" or payload.get("error") is not None:
            return {
                "type": "run.failed",
                "payload": payload,
                "source": source,
            }
        return {
            "type": "run.completed",
            "payload": payload,
            "source": source,
        }

    if event_type in KNOWN_TYPES:
        return {
            "type": event_type,
            "payload": payload,
            "source": source,
        }

    return {
        "type": "adapter.warning",
        "payload": {
            "message": f"Unknown event type: {event_type}",
            "original": raw_event,
        },
        "source": "adapter",
    }


def is_terminal_event(event_type: str) -> bool:
    """Return True if *event_type* represents a terminal run state."""
    return event_type in TERMINAL_EVENTS

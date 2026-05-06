"""Hermes event normalizer — defensive mapping from raw Hermes SSE events."""

from __future__ import annotations

from typing import Any

from hermes_adapter.studio_events import StudioEventSource, make_studio_event

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
    "adapter.warning",
    "kanban.updated",
    "memory.updated",
}


def _source_from(raw_event: dict[str, Any]) -> StudioEventSource:
    source = raw_event.get("source")
    if source == "adapter":
        return "adapter"
    if source == "studio":
        return "studio"
    return "hermes"


def _payload_from(raw_event: dict[str, Any]) -> dict[str, Any]:
    payload = raw_event.get("payload", {})
    if isinstance(payload, dict):
        return payload
    return {"value": payload}


def normalize_hermes_event(raw_event: dict[str, Any]) -> dict[str, Any]:
    """Normalize a raw Hermes event into the adapter's stable event schema."""
    event_type = raw_event.get("type", "")
    source = _source_from(raw_event)
    payload = _payload_from(raw_event)

    # Defensive: upstream sometimes signals failure inside run.completed
    if event_type == "run.completed":
        if payload.get("status") == "failed" or payload.get("error") is not None:
            return make_studio_event("run.failed", payload, source=source)
        return make_studio_event("run.completed", payload, source=source)

    if event_type in KNOWN_TYPES:
        return make_studio_event(event_type, payload, source=source)

    return make_studio_event(
        "adapter.warning",
        {
            "code": "unknown_event",
            "message": f"Unknown event type: {event_type}",
            "original_type": event_type,
        },
        source="adapter",
    )


def is_terminal_event(event_type: str) -> bool:
    """Return True if *event_type* represents a terminal run state."""
    return event_type in TERMINAL_EVENTS

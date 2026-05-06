"""Utilities for producing complete Studio event envelopes."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4

StudioEventSource = Literal["adapter", "hermes", "studio"]


def make_studio_event(
    event_type: str,
    payload: dict[str, Any] | None = None,
    *,
    source: StudioEventSource = "adapter",
    run_id: str | None = None,
    session_id: str | None = None,
) -> dict[str, Any]:
    """Return a StudioEvent that matches the public event schema."""
    event_payload = dict(payload or {})
    resolved_run_id = run_id or _optional_str(event_payload.get("run_id"))
    resolved_session_id = session_id or _optional_str(event_payload.get("session_id"))

    event: dict[str, Any] = {
        "id": f"evt_{uuid4().hex}",
        "type": event_type,
        "timestamp": datetime.now(UTC).isoformat(),
        "source": source,
        "payload": event_payload,
    }
    if resolved_run_id:
        event["run_id"] = resolved_run_id
    if resolved_session_id:
        event["session_id"] = resolved_session_id
    return event


def _optional_str(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value)
    return text or None

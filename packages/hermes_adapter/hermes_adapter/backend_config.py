"""Backend mode configuration for Hermes Desktop Studio adapter."""

from __future__ import annotations

import os
from typing import Literal

BackendMode = Literal["mock", "hermes", "auto"]


def get_backend_mode() -> BackendMode:
    """Read backend mode from HERMES_STUDIO_BACKEND env var.

    Returns:
        "mock" | "hermes" | "auto" (default: "auto")
    """
    raw = os.environ.get("HERMES_STUDIO_BACKEND", "auto").lower().strip()
    if raw in ("mock", "hermes", "auto"):
        return raw  # type: ignore[return-value]
    return "auto"


def get_hermes_api_url() -> str:
    """Read Hermes API base URL from env var.

    Returns:
        Default: "http://127.0.0.1:8642"
    """
    return os.environ.get("HERMES_API_BASE_URL", "http://127.0.0.1:8642").rstrip("/")


def get_hermes_api_key() -> str | None:
    """Read optional Hermes API key from env var.

    Returns:
        API key string or None.
    """
    return os.environ.get("HERMES_API_KEY") or None


def get_debug_events() -> bool:
    """Check if debug event logging is enabled.

    Returns:
        True if HERMES_STUDIO_DEBUG_EVENTS=1
    """
    return os.environ.get("HERMES_STUDIO_DEBUG_EVENTS", "0") == "1"

"""Abstract base class for studio backends."""

from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from typing import Any


class StudioBackend(ABC):
    """Abstract backend interface for Hermes Desktop Studio.

    Implementations:
    - MockBackend: fake in-memory data for development
    - HermesBackend: real Hermes Agent API integration
    """

    @abstractmethod
    async def health(self) -> dict[str, Any]:
        """Return backend health status."""
        ...

    @abstractmethod
    async def bootstrap(self) -> dict[str, Any]:
        """Return initial bootstrap payload for the UI."""
        ...

    @abstractmethod
    async def list_profiles(self) -> list[dict[str, Any]]:
        """Return available profiles."""
        ...

    async def get_active_profile(self) -> dict[str, Any] | None:
        """Return the active profile metadata. Override in subclasses."""
        return None

    async def activate_profile(self, profile_id: str) -> dict[str, Any]:
        """Activate a profile. Returns {status, message}."""
        return {"status": "not_implemented", "message": "Profile switching not yet implemented"}

    @abstractmethod
    async def list_sessions(self) -> dict[str, Any]:
        """Return session list with total count."""
        ...

    @abstractmethod
    async def get_session(self, session_id: str) -> dict[str, Any]:
        """Return session detail with transcript preview."""
        ...

    @abstractmethod
    async def start_run(self, session_id: str, prompt: str, profile: str | None = None) -> dict[str, Any]:
        """Start a new run. Returns {run_id, status}."""
        ...

    @abstractmethod
    def stream_run_events(self, run_id: str) -> AsyncIterator[dict[str, Any]]:
        """Yield normalized StudioEvent envelopes for a run."""
        ...

    @abstractmethod
    async def stop_run(self, run_id: str) -> dict[str, Any]:
        """Stop an active run. Returns {run_id, status}."""
        ...

    @abstractmethod
    async def get_logs(self, source: str | None = None, tail: int = 100) -> dict[str, Any]:
        """Return recent log lines."""
        ...

    @abstractmethod
    def stream_logs(self, source: str | None = None) -> AsyncIterator[dict[str, Any]]:
        """Yield normalized log.line StudioEvent envelopes."""
        ...

    @abstractmethod
    async def list_themes(self) -> dict[str, Any]:
        """Return installed themes and active theme ID."""
        ...

    async def get_theme(self, theme_id: str) -> dict[str, Any]:
        """Return a specific theme by ID. Override in subclasses."""
        raise ValueError(f"Theme '{theme_id}' not found")

    async def get_active_theme(self) -> dict[str, Any]:
        """Return the active theme data. Override in subclasses."""
        return {}

    @abstractmethod
    async def activate_theme(self, theme_id: str) -> dict[str, Any]:
        """Activate a theme. Returns theme info."""
        ...

    async def reload_themes(self) -> dict[str, Any]:
        """Reload theme packs from disk. Override in subclasses."""
        return {"reloaded": False, "count": 0}

    @abstractmethod
    async def get_config(self) -> dict[str, Any]:
        """Return current configuration."""
        ...

    async def get_model_config(self) -> dict[str, Any]:
        """Return normalized model/provider config. Override in subclasses."""
        return {
            "provider": "unknown",
            "model": "unknown",
            "api_key_configured": False,
            "config_source": "unavailable",
            "warnings": ["Model config not available in this backend"],
        }

    @abstractmethod
    async def patch_config(self, key: str, value: Any) -> dict[str, Any]:
        """Update a config key. Returns updated config."""
        ...

"""In-memory TTL cache for config reads.

Thread-safe with asyncio.Lock. Supports prefix-based invalidation.
"""

from __future__ import annotations

import asyncio
import time
from dataclasses import dataclass
from typing import Any


@dataclass
class _CacheEntry:
    value: Any
    expires_at: float


class ConfigCache:
    """In-memory cache with configurable TTL (default 5 seconds).

    Thread-safe via asyncio.Lock. Supports:
    - get() / set() for individual keys
    - invalidate() to remove a single key
    - invalidate_prefix() to remove all keys matching a prefix
    """

    def __init__(self, default_ttl: float = 5.0) -> None:
        self._default_ttl = default_ttl
        self._store: dict[str, _CacheEntry] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        """Return cached value if present and not expired, else None."""
        async with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            if time.monotonic() >= entry.expires_at:
                del self._store[key]
                return None
            return entry.value

    async def set(self, key: str, value: Any, ttl: float | None = None) -> None:
        """Store a value with the given TTL (or default)."""
        effective_ttl = ttl if ttl is not None else self._default_ttl
        async with self._lock:
            self._store[key] = _CacheEntry(
                value=value,
                expires_at=time.monotonic() + effective_ttl,
            )

    async def invalidate(self, key: str) -> None:
        """Remove a single key from the cache."""
        async with self._lock:
            self._store.pop(key, None)

    async def invalidate_prefix(self, prefix: str) -> None:
        """Remove all keys that start with *prefix*."""
        async with self._lock:
            keys_to_remove = [k for k in self._store if k.startswith(prefix)]
            for k in keys_to_remove:
                del self._store[k]

    async def clear(self) -> None:
        """Remove all entries."""
        async with self._lock:
            self._store.clear()

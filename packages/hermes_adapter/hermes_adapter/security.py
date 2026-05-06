"""Local authentication utilities for the Hermes Adapter."""

from __future__ import annotations

import secrets
from pathlib import Path

from fastapi import HTTPException, Request, status

_auth_token: str | None = None


def _auth_error(code: str, message: str) -> dict[str, object]:
    return {
        "error": {
            "code": code,
            "message": message,
            "retryable": False,
            "source": "adapter",
            "hint": "Start the adapter and initialize the desktop auth token before calling protected /studio/* endpoints.",
        }
    }


def set_auth_token(token: str | None) -> None:
    """Set an in-memory auth token (used primarily by tests)."""
    global _auth_token
    _auth_token = token


def generate_token() -> str:
    """Generate a random 32-byte hex token."""
    return secrets.token_hex(32)


def get_token_path() -> Path:
    """Return the path to the local runtime token file."""
    return Path.home() / ".hermes-local-shell" / "runtime" / "token"


def write_token(token: str) -> None:
    """Write the token to disk with restrictive permissions.

    Creates parent directories if they do not exist.
    """
    path = get_token_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(token, encoding="utf-8")
    path.chmod(0o600)


def read_token() -> str:
    """Read the token from memory or disk.

    Raises:
        FileNotFoundError: If the token file does not exist and no in-memory token is set.
    """
    if _auth_token is not None:
        return _auth_token
    return get_token_path().read_text(encoding="utf-8").strip()


async def require_token(request: Request) -> None:
    """FastAPI dependency that validates the Bearer token header.

    Raises:
        HTTPException: 401 if the token is missing or invalid.
    """
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_auth_error("auth_missing", "Missing or invalid Authorization header"),
            headers={"WWW-Authenticate": "Bearer"},
        )

    provided = auth[7:].strip()
    try:
        expected = read_token()
    except FileNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_auth_error("auth_uninitialized", "Token not initialized"),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=_auth_error("auth_invalid", "Invalid token"),
            headers={"WWW-Authenticate": "Bearer"},
        )

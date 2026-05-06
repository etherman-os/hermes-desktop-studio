"""Entry point for Hermes Local Shell TUI."""

from __future__ import annotations

import argparse
from pathlib import Path

from hermes_shell_ui.app import HermesShellApp


TOKEN_PATH = Path.home() / ".hermes-local-shell" / "runtime" / "token"


def _load_token() -> str:
    """Load bearer token from disk if present."""
    if TOKEN_PATH.exists():
        return TOKEN_PATH.read_text(encoding="utf-8").strip()
    return ""


def main() -> None:
    parser = argparse.ArgumentParser(description="Hermes Local Shell")
    parser.add_argument("--theme", default=None, help="Theme ID to apply on startup")
    args = parser.parse_args()

    token = _load_token()
    app = HermesShellApp(theme_id=args.theme, token=token)
    app.run()


if __name__ == "__main__":
    main()

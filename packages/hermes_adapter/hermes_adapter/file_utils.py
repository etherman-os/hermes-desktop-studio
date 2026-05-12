"""Atomic file write utilities.

All writes use temp-file + rename to prevent partial writes.
"""

from __future__ import annotations

import json
import logging
import os
import tempfile
from contextlib import suppress
from pathlib import Path
from typing import Any

import yaml

logger = logging.getLogger("hermes_adapter.file_utils")


def safe_write(path: str | Path, content: str, *, encoding: str = "utf-8") -> None:
    """Atomic write: write to a temp file in the same directory, then rename.

    This prevents partial writes if the process crashes mid-write.

    Args:
        path: Destination file path.
        content: Text content to write.
        encoding: File encoding (default utf-8).
    """
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)

    fd, tmp_path = tempfile.mkstemp(
        dir=str(target.parent),
        prefix=f".{target.name}.",
        suffix=".tmp",
    )
    try:
        with os.fdopen(fd, "w", encoding=encoding) as f:
            f.write(content)
        os.replace(tmp_path, str(target))
    except Exception:
        with suppress(OSError):
            os.unlink(tmp_path)
        raise


def safe_write_json(path: str | Path, data: Any, *, indent: int = 2) -> None:
    """Serialize *data* as JSON and atomically write to *path*."""
    content = json.dumps(data, indent=indent, ensure_ascii=False, default=str)
    safe_write(path, content + "\n")


def safe_write_yaml(path: str | Path, data: Any) -> None:
    """Serialize *data* as YAML and atomically write to *path*."""
    content = yaml.safe_dump(data, default_flow_style=False, allow_unicode=True)
    safe_write(path, content)

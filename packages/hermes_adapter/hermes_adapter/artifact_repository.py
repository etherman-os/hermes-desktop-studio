"""Studio-owned persistent artifact repository.

Artifacts are metadata and small text outputs stored in Studio-owned studio.db.
This module never reads or writes Hermes Agent state.db and never executes
artifact content.
"""

from __future__ import annotations

import json
import re
import sqlite3
from collections.abc import Mapping
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

from hermes_adapter.studio_storage import StudioStorage, StudioStorageError

_ARTIFACT_TYPES = {
    "markdown",
    "text",
    "log_snapshot",
    "test_result",
    "report",
    "html",
    "screenshot",
    "file_reference",
    "json",
    "unknown",
}
_MAX_CONTENT_CHARS = 200_000
_MAX_TITLE_CHARS = 200
_MAX_DESCRIPTION_CHARS = 5000
_MAX_PATH_CHARS = 2000
_MAX_MIME_CHARS = 128
_CONTROL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_ID_RE = re.compile(r"^[A-Za-z0-9_.:-]{1,128}$")
_SECRET_KEY_RE = re.compile(r"(?i)(api[_-]?key|token|secret|password|auth|bearer)")
_SECRET_VALUE_PATTERNS = (
    re.compile(r"Bearer\s+[A-Za-z0-9._:-]+", re.IGNORECASE),
    re.compile(r"(?i)\b(sk-|xai-|tvly-)[a-zA-Z0-9._-]+"),
    re.compile(r"(?i)\b(api[_-]?key|token|secret|password)\s*[:=]\s*['\"]?[^'\"\\s]+"),
    re.compile(r"\b[a-f0-9]{32,}\b", re.IGNORECASE),
)


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def _redact_text(value: str) -> str:
    redacted = value
    for pattern in _SECRET_VALUE_PATTERNS:
        redacted = pattern.sub("[REDACTED]", redacted)
    return redacted


def _clean_text(value: Any, field: str, *, max_length: int, required: bool = False) -> str:
    if value is None:
        if required:
            raise ValueError(f"{field} is required")
        return ""
    if not isinstance(value, str):
        raise ValueError(f"{field} must be a string")
    cleaned = _CONTROL_RE.sub("", value).strip()
    if required and not cleaned:
        raise ValueError(f"{field} is required")
    if len(cleaned) > max_length:
        raise ValueError(f"{field} must be {max_length} characters or less")
    return _redact_text(cleaned)


def _clean_optional_text(value: Any, field: str, *, max_length: int) -> str | None:
    cleaned = _clean_text(value, field, max_length=max_length)
    return cleaned if cleaned else None


def _clean_content(value: Any) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("content_text must be a string")
    cleaned = _CONTROL_RE.sub("", value)
    if len(cleaned) > _MAX_CONTENT_CHARS:
        raise ValueError(f"content_text must be {_MAX_CONTENT_CHARS} characters or less")
    return _redact_text(cleaned)


def _clean_optional_id(value: Any, field: str) -> str | None:
    if value is None or value == "":
        return None
    text = _clean_text(value, field, max_length=128, required=True)
    if not _ID_RE.match(text):
        raise ValueError(f"{field} has invalid characters")
    return text


def _clean_artifact_type(value: Any) -> str:
    artifact_type = _clean_text(value or "unknown", "type", max_length=64) or "unknown"
    return artifact_type if artifact_type in _ARTIFACT_TYPES else "unknown"


def _clean_source(value: Any) -> str:
    source = _clean_text(value or "manual", "source", max_length=64) or "manual"
    if _SECRET_KEY_RE.search(source):
        raise StudioStorageError("artifact source refuses secret-like values")
    return source


def _clean_size_bytes(value: Any) -> int | None:
    if value is None or value == "":
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError("size_bytes must be an integer")
    if value < 0:
        raise ValueError("size_bytes must be non-negative")
    return int(value)


def _display_path(path: str | None) -> str | None:
    if not path:
        return None
    return Path(path).name or path


def _clean_payload_value(value: Any, field: str) -> Any:
    if isinstance(value, str):
        return _clean_text(value, field, max_length=1000)
    if isinstance(value, (int, float, bool)) or value is None:
        return value
    if isinstance(value, list):
        return [_clean_payload_value(item, field) for item in value]
    if isinstance(value, dict):
        return _validate_payload(value)
    raise ValueError("payload values must be JSON-serializable")


def _validate_payload(payload: Mapping[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in payload.items():
        clean_key = _clean_text(key, "payload key", max_length=64, required=True)
        if _SECRET_KEY_RE.search(clean_key):
            raise StudioStorageError("artifact event refuses secret-like fields")
        result[clean_key] = _clean_payload_value(value, clean_key)
    return result


class ArtifactRepository:
    """Persistent artifact operations backed by StudioStorage."""

    def __init__(self, storage: StudioStorage | None = None) -> None:
        self._storage = storage or StudioStorage()

    def list_artifacts(
        self,
        *,
        artifact_type: str | None = None,
        source: str | None = None,
        run_id: str | None = None,
        session_id: str | None = None,
        card_id: str | None = None,
        search: str | None = None,
        include_archived: bool = False,
        limit: int = 100,
    ) -> dict[str, Any]:
        filters: list[str] = []
        params: list[Any] = []
        if not include_archived:
            filters.append("archived_at IS NULL")
        if artifact_type:
            filters.append("type = ?")
            params.append(_clean_artifact_type(artifact_type))
        if source:
            filters.append("source = ?")
            params.append(_clean_source(source))
        if run_id:
            filters.append("run_id = ?")
            params.append(_clean_optional_id(run_id, "run_id"))
        if session_id:
            filters.append("session_id = ?")
            params.append(_clean_optional_id(session_id, "session_id"))
        if card_id:
            filters.append("kanban_card_id = ?")
            params.append(_clean_optional_id(card_id, "kanban_card_id"))
        if search:
            cleaned_search = _clean_text(search, "search", max_length=200)
            if cleaned_search:
                filters.append("(title LIKE ? OR COALESCE(description, '') LIKE ?)")
                pattern = f"%{cleaned_search}%"
                params.extend([pattern, pattern])

        safe_limit = min(max(limit, 1), 250)
        where = f"WHERE {' AND '.join(filters)}" if filters else ""
        with self._storage.connect() as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM artifacts
                {where}
                ORDER BY created_at DESC, id DESC
                LIMIT ?
                """,
                (*params, safe_limit),
            ).fetchall()
            return {
                "artifacts": [self._artifact_dict(row, include_content=False) for row in rows],
                "total": len(rows),
            }

    def get_artifact(self, artifact_id: str) -> dict[str, Any]:
        with self._storage.connect() as conn:
            artifact = self._require_artifact(conn, artifact_id, include_archived=True, include_content=True)
            events = conn.execute(
                "SELECT * FROM artifact_events WHERE artifact_id = ? ORDER BY created_at, id",
                (artifact["id"],),
            ).fetchall()
            artifact["events"] = [self._event_dict(row) for row in events]
            return artifact

    def create_artifact(self, input_data: Mapping[str, Any]) -> dict[str, Any]:
        title = _clean_text(input_data.get("title"), "title", max_length=_MAX_TITLE_CHARS, required=True)
        artifact_type = _clean_artifact_type(input_data.get("type"))
        description = _clean_optional_text(input_data.get("description"), "description", max_length=_MAX_DESCRIPTION_CHARS)
        content_text = _clean_content(input_data.get("content_text"))
        file_path = _clean_optional_text(input_data.get("file_path"), "file_path", max_length=_MAX_PATH_CHARS)
        mime_type = _clean_optional_text(input_data.get("mime_type"), "mime_type", max_length=_MAX_MIME_CHARS)
        size_bytes = _clean_size_bytes(input_data.get("size_bytes"))
        run_id = _clean_optional_id(input_data.get("run_id"), "run_id")
        session_id = _clean_optional_id(input_data.get("session_id"), "session_id")
        card_id = _clean_optional_id(input_data.get("kanban_card_id"), "kanban_card_id")
        source = _clean_source(input_data.get("source"))
        if artifact_type == "file_reference" and not file_path:
            raise ValueError("file_path is required for file_reference artifacts")
        artifact_id = _new_id("artifact")
        now = _now_iso()
        with self._storage.connect() as conn:
            conn.execute(
                """
                INSERT INTO artifacts (
                  id, title, type, description, content_text, file_path, mime_type, size_bytes,
                  run_id, session_id, kanban_card_id, source, created_at, updated_at, archived_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
                """,
                (
                    artifact_id,
                    title,
                    artifact_type,
                    description,
                    content_text,
                    file_path,
                    mime_type,
                    size_bytes,
                    run_id,
                    session_id,
                    card_id,
                    source,
                    now,
                    now,
                ),
            )
            self._add_artifact_event(conn, artifact_id, "artifact.created", {"title": title, "type": artifact_type})
            return self._require_artifact(conn, artifact_id, include_content=True)

    def update_artifact(self, artifact_id: str, input_data: Mapping[str, Any]) -> dict[str, Any]:
        clean_artifact_id = self._clean_artifact_id(artifact_id)
        updates: dict[str, Any] = {}
        if "title" in input_data:
            updates["title"] = _clean_text(input_data["title"], "title", max_length=_MAX_TITLE_CHARS, required=True)
        if "type" in input_data:
            updates["type"] = _clean_artifact_type(input_data["type"])
        if "description" in input_data:
            updates["description"] = _clean_optional_text(input_data["description"], "description", max_length=_MAX_DESCRIPTION_CHARS)
        if "content_text" in input_data:
            updates["content_text"] = _clean_content(input_data["content_text"])
        if "file_path" in input_data:
            updates["file_path"] = _clean_optional_text(input_data["file_path"], "file_path", max_length=_MAX_PATH_CHARS)
        if "mime_type" in input_data:
            updates["mime_type"] = _clean_optional_text(input_data["mime_type"], "mime_type", max_length=_MAX_MIME_CHARS)
        if "size_bytes" in input_data:
            updates["size_bytes"] = _clean_size_bytes(input_data["size_bytes"])
        if "source" in input_data:
            updates["source"] = _clean_source(input_data["source"])
        with self._storage.connect() as conn:
            self._require_artifact(conn, clean_artifact_id)
            if updates:
                now = _now_iso()
                assignments = ", ".join(f"{key} = ?" for key in updates)
                conn.execute(
                    f"UPDATE artifacts SET {assignments}, updated_at = ? WHERE id = ?",
                    (*updates.values(), now, clean_artifact_id),
                )
                self._add_artifact_event(conn, clean_artifact_id, "artifact.updated", {"fields": sorted(updates)})
            return self._require_artifact(conn, clean_artifact_id, include_content=True)

    def archive_artifact(self, artifact_id: str) -> dict[str, Any]:
        clean_artifact_id = self._clean_artifact_id(artifact_id)
        with self._storage.connect() as conn:
            artifact = self._require_artifact(conn, clean_artifact_id, include_archived=True)
            if not artifact.get("archived_at"):
                archived_at = _now_iso()
                conn.execute(
                    "UPDATE artifacts SET archived_at = ?, updated_at = ? WHERE id = ?",
                    (archived_at, archived_at, clean_artifact_id),
                )
                self._add_artifact_event(conn, clean_artifact_id, "artifact.archived", {})
            return self._require_artifact(conn, clean_artifact_id, include_archived=True, include_content=True)

    def link_artifact_to_run(self, artifact_id: str, run_id: str) -> dict[str, Any]:
        return self._link_artifact(artifact_id, "run_id", run_id, "artifact.linked_run")

    def link_artifact_to_session(self, artifact_id: str, session_id: str) -> dict[str, Any]:
        return self._link_artifact(artifact_id, "session_id", session_id, "artifact.linked_session")

    def link_artifact_to_card(self, artifact_id: str, card_id: str) -> dict[str, Any]:
        return self._link_artifact(artifact_id, "kanban_card_id", card_id, "artifact.linked_card")

    def _link_artifact(self, artifact_id: str, field: str, value: str, event_type: str) -> dict[str, Any]:
        clean_artifact_id = self._clean_artifact_id(artifact_id)
        clean_value = _clean_optional_id(value, field)
        if not clean_value:
            raise ValueError(f"{field} is required")
        with self._storage.connect() as conn:
            self._require_artifact(conn, clean_artifact_id)
            conn.execute(
                f"UPDATE artifacts SET {field} = ?, updated_at = ? WHERE id = ?",
                (clean_value, _now_iso(), clean_artifact_id),
            )
            self._add_artifact_event(conn, clean_artifact_id, event_type, {field: clean_value})
            return self._require_artifact(conn, clean_artifact_id, include_content=True)

    @staticmethod
    def _artifact_dict(row: sqlite3.Row, *, include_content: bool) -> dict[str, Any]:
        artifact = {
            "id": row["id"],
            "title": row["title"],
            "type": row["type"],
            "description": row["description"],
            "file_path": row["file_path"],
            "file_name": _display_path(row["file_path"]),
            "mime_type": row["mime_type"],
            "size_bytes": row["size_bytes"],
            "run_id": row["run_id"],
            "session_id": row["session_id"],
            "kanban_card_id": row["kanban_card_id"],
            "source": row["source"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "archived_at": row["archived_at"],
            "has_content": bool(row["content_text"]),
        }
        if include_content:
            artifact["content_text"] = row["content_text"]
        return artifact

    @staticmethod
    def _event_dict(row: sqlite3.Row) -> dict[str, Any]:
        return {
            "id": row["id"],
            "artifact_id": row["artifact_id"],
            "type": row["type"],
            "payload": json.loads(row["payload_json"]),
            "created_at": row["created_at"],
        }

    def _require_artifact(
        self,
        conn: sqlite3.Connection,
        artifact_id: str,
        *,
        include_archived: bool = False,
        include_content: bool = False,
    ) -> dict[str, Any]:
        clean_artifact_id = self._clean_artifact_id(artifact_id)
        sql = "SELECT * FROM artifacts WHERE id = ?"
        if not include_archived:
            sql += " AND archived_at IS NULL"
        row = conn.execute(sql, (clean_artifact_id,)).fetchone()
        if not row:
            raise ValueError(f"Artifact '{artifact_id}' not found")
        return self._artifact_dict(row, include_content=include_content)

    def _add_artifact_event(
        self,
        conn: sqlite3.Connection,
        artifact_id: str,
        event_type: str,
        payload: Mapping[str, Any],
    ) -> dict[str, Any]:
        clean_payload = _validate_payload(payload)
        event_id = _new_id("artifact_evt")
        created_at = _now_iso()
        conn.execute(
            """
            INSERT INTO artifact_events (id, artifact_id, type, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                event_id,
                artifact_id,
                event_type,
                json.dumps(clean_payload, sort_keys=True, ensure_ascii=False),
                created_at,
            ),
        )
        row = conn.execute("SELECT * FROM artifact_events WHERE id = ?", (event_id,)).fetchone()
        if not row:
            raise RuntimeError(f"Artifact event '{event_id}' was not persisted")
        return self._event_dict(row)

    @staticmethod
    def _clean_artifact_id(artifact_id: str) -> str:
        clean_artifact_id = _clean_optional_id(artifact_id, "artifact_id")
        if not clean_artifact_id:
            raise ValueError("artifact_id is required")
        return clean_artifact_id

"""Studio API routes — delegates to backend abstraction layer.

Supports mock and Hermes backends. Frontend always talks to /studio/* endpoints.
"""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from hermes_adapter.backend_base import StudioBackend
from hermes_adapter.run_ledger_repository import RunLedgerRepository
from hermes_adapter.security import require_token
from hermes_adapter.studio_events import make_studio_event
from hermes_adapter.studio_storage import get_studio_storage_status

router = APIRouter(prefix="/studio")
logger = logging.getLogger(__name__)

# Backend instance — initialized on first request
_backend: StudioBackend | None = None
_backend_status: dict[str, Any] = {}


async def _get_backend() -> StudioBackend:
    """Get or create the backend instance."""
    global _backend, _backend_status
    if _backend is None:
        from hermes_adapter.backend_factory import create_backend
        _backend, _backend_status = await create_backend()
    return _backend


def _sse(data: dict[str, Any]) -> str:
    event_type = data.get("type", "unknown")
    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


def _error_detail(
    code: str,
    message: str,
    *,
    retryable: bool = False,
    source: str = "adapter",
    hint: str | None = None,
) -> dict[str, Any]:
    return {
        "error": {
            "code": code,
            "message": message,
            "retryable": retryable,
            "source": source,
            "hint": hint,
        }
    }


def _backend_name() -> str:
    active = _backend_status.get("active_backend")
    mode = _backend_status.get("backend_mode")
    return str(active or mode or "unknown")


async def _model_name(backend: StudioBackend) -> str | None:
    try:
        model_config = await backend.get_model_config()
    except Exception:
        return None
    model = model_config.get("model")
    return str(model) if model else None


def _event_with_run_id(event: dict[str, Any], run_id: str) -> dict[str, Any]:
    if event.get("run_id"):
        return event
    return {**event, "run_id": run_id}


def _persist_started_run(
    *,
    run_id: str,
    session_id: str | None,
    status: str,
    prompt: str,
    backend: str,
    model: str | None,
    workspace_path: str | None,
) -> None:
    try:
        RunLedgerRepository().create_run(
            run_id=run_id,
            session_id=session_id,
            status=status,
            prompt=prompt,
            backend=backend,
            model=model,
            workspace_path=workspace_path,
        )
    except Exception as exc:
        logger.warning("Run ledger create failed for %s: %s", run_id, exc)


def _persist_run_event(run_id: str, event: dict[str, Any]) -> dict[str, Any] | None:
    try:
        RunLedgerRepository().append_event(run_id, event)
    except Exception as exc:
        logger.warning("Run ledger event persistence failed for %s: %s", run_id, exc)
        return make_studio_event(
            "adapter.warning",
            {
                "code": "run_ledger_persistence_unavailable",
                "message": "Run history is unavailable; live stream continues.",
            },
            source="adapter",
            run_id=run_id,
        )
    return None


def _run_ledger_http_error(error: ValueError | RuntimeError) -> HTTPException:
    message = str(error)
    status_code = 404 if "not found" in message.lower() else 503
    code = "not_found" if status_code == 404 else "run_ledger_unavailable"
    return HTTPException(
        status_code=status_code,
        detail=_error_detail(code, message, source="studio", retryable=status_code != 404),
    )


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@router.get("/health")
async def health() -> dict[str, Any]:
    backend = await _get_backend()
    h = await backend.health()
    h["backend_status"] = _backend_status
    h["storage"] = get_studio_storage_status()
    return h


# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------


@router.get("/bootstrap")
async def bootstrap(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        data = await backend.bootstrap()
        data["backend_status"] = _backend_status
        data["storage"] = get_studio_storage_status()
        return data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=_error_detail("bootstrap_error", str(e), retryable=True),
        ) from e


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------


@router.get("/profiles")
async def list_profiles(_token: None = Depends(require_token)) -> list[dict[str, Any]]:
    backend = await _get_backend()
    return await backend.list_profiles()


@router.get("/profiles/active")
async def get_active_profile(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    profile = await backend.get_active_profile()
    if profile:
        return profile
    return {"name": "unknown", "path": "", "active": True}


@router.post("/profiles/activate")
async def activate_profile(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    profile_id = body.get("profile_id", "")
    result = await backend.activate_profile(profile_id)
    if result.get("status") == "not_implemented":
        raise HTTPException(
            status_code=501,
            detail=_error_detail(
                "not_implemented",
                result.get("message", "Profile switching not implemented"),
                hint="Profile switching is intentionally disabled until a safe CLI-backed path is added.",
            ),
        )
    return result


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


@router.get("/sessions")
async def list_sessions(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.list_sessions()


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_session(session_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=_error_detail("not_found", f"Session '{session_id}' not found"),
        ) from e


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------


@router.post("/runs")
async def start_run(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    session_id = body.get("session_id", "default")
    prompt = body.get("prompt", "")
    profile = body.get("profile")
    context = body.get("context", {})
    workspace_path = body.get("workspace_path")
    if not workspace_path and isinstance(context, dict):
        workspace_path = context.get("workspace_path")
    result = await backend.start_run(session_id, prompt, profile)
    if result.get("status") == "failed":
        raise HTTPException(
            status_code=502,
            detail=_error_detail(
                "run_failed",
                result.get("error", "Run failed"),
                retryable=True,
                source="hermes",
            ),
        )
    run_id = result.get("run_id")
    if run_id:
        _persist_started_run(
            run_id=str(run_id),
            session_id=str(session_id) if session_id else None,
            status=str(result.get("status", "started")),
            prompt=str(prompt),
            backend=_backend_name(),
            model=await _model_name(backend),
            workspace_path=str(workspace_path) if workspace_path else None,
        )
    return result


@router.get("/runs/recent")
async def get_recent_runs(
    limit: int = Query(50, ge=1, le=100),
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_recent_runs(limit=limit)
    except (RuntimeError, ValueError) as e:
        raise _run_ledger_http_error(e) from e


@router.get("/runs/{run_id}")
async def get_run(run_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_run(run_id)
    except (RuntimeError, ValueError) as e:
        raise _run_ledger_http_error(e) from e


@router.get("/runs/{run_id}/ledger")
async def get_run_ledger(run_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_run_ledger(run_id)
    except (RuntimeError, ValueError) as e:
        raise _run_ledger_http_error(e) from e


@router.get("/runs/{run_id}/events")
async def stream_run_events(run_id: str, _token: None = Depends(require_token)) -> StreamingResponse:
    backend = await _get_backend()

    async def event_generator() -> AsyncIterator[str]:
        warned_about_persistence = False
        async for event in backend.stream_run_events(run_id):
            enriched = _event_with_run_id(event, run_id)
            warning = _persist_run_event(run_id, enriched)
            yield _sse(enriched)
            if warning and not warned_about_persistence:
                warned_about_persistence = True
                yield _sse(warning)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/runs/{run_id}/stop")
async def stop_run(run_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.stop_run(run_id)


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------


@router.get("/logs")
async def get_logs(
    source: str | None = Query(None, description="Log file name"),
    tail: int = Query(100, description="Number of recent lines"),
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.get_logs(source=source, tail=tail)


@router.get("/logs/stream")
async def stream_logs(
    source: str | None = Query(None, description="Log file name to stream"),
    _token: None = Depends(require_token),
) -> StreamingResponse:
    backend = await _get_backend()

    async def log_generator() -> AsyncIterator[str]:
        async for event in backend.stream_logs(source=source):
            yield _sse(event)

    return StreamingResponse(log_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Model / Provider Config
# ---------------------------------------------------------------------------


@router.get("/model-config")
async def get_model_config(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.get_model_config()


# ---------------------------------------------------------------------------
# Themes
# ---------------------------------------------------------------------------


@router.get("/themes")
async def list_themes(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.list_themes()


@router.get("/themes/active")
async def get_active_theme(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.get_active_theme()


@router.get("/themes/{theme_id}")
async def get_theme(theme_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_theme(theme_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=_error_detail("not_found", f"Theme '{theme_id}' not found"),
        ) from e


@router.post("/themes/activate")
async def activate_theme(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    theme_id = body.get("theme_id", "")
    try:
        return await backend.activate_theme(theme_id)
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=_error_detail("not_found", f"Theme '{theme_id}' not found"),
        ) from e


@router.post("/themes/reload")
async def reload_themes(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.reload_themes()


# ---------------------------------------------------------------------------
# Kanban
# ---------------------------------------------------------------------------


def _kanban_http_error(error: ValueError | RuntimeError) -> HTTPException:
    message = str(error)
    status_code = 404 if "not found" in message.lower() else 400
    return HTTPException(
        status_code=status_code,
        detail=_error_detail("kanban_error", message, source="studio"),
    )


@router.get("/kanban/boards")
async def get_kanban_boards(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_kanban_boards()
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.get("/kanban/boards/default")
async def get_default_kanban_board(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_default_kanban_board()
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.get("/kanban/boards/{board_id}")
async def get_kanban_board(board_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_kanban_board(board_id)
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.post("/kanban/cards")
async def create_kanban_card(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.create_kanban_card(body)
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.patch("/kanban/cards/{card_id}")
async def update_kanban_card(
    card_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.update_kanban_card(card_id, body)
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.post("/kanban/cards/{card_id}/move")
async def move_kanban_card(
    card_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.move_kanban_card(card_id, body.get("column_id", ""), body.get("position", 0))
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.post("/kanban/cards/{card_id}/archive")
async def archive_kanban_card(card_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.archive_kanban_card(card_id)
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.post("/kanban/cards/{card_id}/link-session")
async def link_kanban_card_to_session(
    card_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.link_kanban_card_to_session(card_id, body.get("session_id", ""))
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


@router.post("/kanban/cards/{card_id}/link-run")
async def link_kanban_card_to_run(
    card_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.link_kanban_card_to_run(card_id, body.get("run_id", ""))
    except (RuntimeError, ValueError) as e:
        raise _kanban_http_error(e) from e


# ---------------------------------------------------------------------------
# Artifacts
# ---------------------------------------------------------------------------


def _artifact_http_error(error: ValueError | RuntimeError) -> HTTPException:
    message = str(error)
    status_code = 404 if "not found" in message.lower() else 400
    return HTTPException(
        status_code=status_code,
        detail=_error_detail("artifact_error", message, source="studio"),
    )


@router.get("/artifacts")
async def list_artifacts(
    type: str | None = Query(None, description="Artifact type filter"),
    source: str | None = Query(None, description="Artifact source filter"),
    run_id: str | None = Query(None, description="Linked run id"),
    session_id: str | None = Query(None, description="Linked session id"),
    card_id: str | None = Query(None, description="Linked Kanban card id"),
    search: str | None = Query(None, description="Search title and description"),
    include_archived: bool = Query(False, description="Include archived artifacts"),
    limit: int = Query(100, ge=1, le=250),
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.list_artifacts(
            {
                "artifact_type": type,
                "source": source,
                "run_id": run_id,
                "session_id": session_id,
                "card_id": card_id,
                "search": search,
                "include_archived": include_archived,
                "limit": limit,
            }
        )
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


@router.get("/artifacts/{artifact_id}")
async def get_artifact(artifact_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.get_artifact(artifact_id)
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


@router.post("/artifacts")
async def create_artifact(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.create_artifact(body)
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


@router.patch("/artifacts/{artifact_id}")
async def update_artifact(
    artifact_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.update_artifact(artifact_id, body)
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


@router.post("/artifacts/{artifact_id}/archive")
async def archive_artifact(artifact_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.archive_artifact(artifact_id)
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


@router.post("/artifacts/{artifact_id}/link-run")
async def link_artifact_to_run(
    artifact_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.link_artifact_to_run(artifact_id, body.get("run_id", ""))
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


@router.post("/artifacts/{artifact_id}/link-session")
async def link_artifact_to_session(
    artifact_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.link_artifact_to_session(artifact_id, body.get("session_id", ""))
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


@router.post("/artifacts/{artifact_id}/link-card")
async def link_artifact_to_card(
    artifact_id: str,
    body: dict[str, Any],
    _token: None = Depends(require_token),
) -> dict[str, Any]:
    backend = await _get_backend()
    try:
        return await backend.link_artifact_to_card(artifact_id, body.get("kanban_card_id", body.get("card_id", "")))
    except (RuntimeError, ValueError) as e:
        raise _artifact_http_error(e) from e


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------


@router.get("/config")
async def get_config(_token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    return await backend.get_config()


@router.patch("/config")
async def patch_config(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    backend = await _get_backend()
    key = body.get("key")
    value = body.get("value")
    if not key:
        raise HTTPException(
            status_code=400,
            detail=_error_detail("invalid_request", "key is required"),
        )
    try:
        return await backend.patch_config(key, value)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=_error_detail("config_error", str(e)),
        ) from e

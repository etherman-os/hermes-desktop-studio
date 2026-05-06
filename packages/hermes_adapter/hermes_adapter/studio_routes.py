"""Studio API routes — fake adapter for desktop studio development.

All /studio/* endpoints return fake in-memory data matching Phase 1 protocol schemas.
This module does NOT touch Hermes Agent core.
"""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Any, AsyncIterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from hermes_adapter.models import (
    ConfigView,
    ErrorDetail,
    ErrorResponse,
    ProfileInfo,
    RunResponse,
    SessionSummary,
    ThemeInfo,
)
from hermes_adapter.security import require_token

router = APIRouter(prefix="/studio")

# ---------------------------------------------------------------------------
# In-memory fake state
# ---------------------------------------------------------------------------

_active_runs: dict[str, dict[str, Any]] = {}
_run_cancelled: set[str] = set()

_PROFILES = [
    ProfileInfo(name="coder", path="~/.hermes-profiles/coder"),
    ProfileInfo(name="research", path="~/.hermes-profiles/research"),
    ProfileInfo(name="writer", path="~/.hermes-profiles/writer"),
]

_SESSIONS = [
    SessionSummary(
        id="s-1",
        title="Map src directory structure",
        created_at=datetime(2026, 5, 6, 10, 0, 0, tzinfo=timezone.utc),
        updated_at=datetime(2026, 5, 6, 10, 5, 0, tzinfo=timezone.utc),
        message_count=12,
    ),
    SessionSummary(
        id="s-2",
        title="Review API endpoint contracts",
        created_at=datetime(2026, 5, 6, 9, 0, 0, tzinfo=timezone.utc),
        updated_at=datetime(2026, 5, 6, 9, 30, 0, tzinfo=timezone.utc),
        message_count=24,
    ),
    SessionSummary(
        id="s-3",
        title="Theme loader bug investigation",
        created_at=datetime(2026, 5, 5, 14, 0, 0, tzinfo=timezone.utc),
        updated_at=datetime(2026, 5, 5, 15, 20, 0, tzinfo=timezone.utc),
        message_count=18,
    ),
    SessionSummary(
        id="s-4",
        title="Write unit tests for adapter",
        created_at=datetime(2026, 5, 5, 11, 0, 0, tzinfo=timezone.utc),
        updated_at=datetime(2026, 5, 5, 12, 0, 0, tzinfo=timezone.utc),
        message_count=8,
    ),
    SessionSummary(
        id="s-5",
        title="Research paper on local-first architecture",
        created_at=datetime(2026, 5, 4, 9, 0, 0, tzinfo=timezone.utc),
        updated_at=datetime(2026, 5, 4, 11, 0, 0, tzinfo=timezone.utc),
        message_count=32,
    ),
]

_THEMES = [
    ThemeInfo(id="default-dark", name="Default Dark", version="0.1.0", author="etherman-os", description="Professional dark theme"),
    ThemeInfo(id="minecraft-overworld", name="Minecraft Overworld", version="0.1.0", author="etherman-os", description="Grass and stone tones"),
    ThemeInfo(id="example-minions", name="Minions", version="0.1.0", author="etherman-os", description="Yellow villain theme"),
    ThemeInfo(id="example-lotr", name="Lord of the Rings", version="0.1.0", author="etherman-os", description="Middle-earth theme"),
    ThemeInfo(id="minimal-light", name="Minimal Light", version="0.1.0", author="etherman-os", description="Clean light theme"),
]

_ACTIVE_THEME_ID = "default-dark"

_CONFIG = {
    "adapter_version": "0.1.0",
    "hermes_base_url": "http://127.0.0.1:39190",
    "hermes_version": "0.12.0",
    "auto_save": True,
    "theme_dir": "~/.hermes/skins",
    "log_level": "info",
}

_KANBAN_CARDS: list[dict[str, Any]] = [
    {"id": "k-1", "title": "Fix theme loader inheritance", "status": "Doing", "priority": "high"},
    {"id": "k-2", "title": "Add SSE mock streaming", "status": "Ready", "priority": "high"},
    {"id": "k-3", "title": "Implement command palette", "status": "Done", "priority": "medium"},
    {"id": "k-4", "title": "Write shared-types package", "status": "Done", "priority": "medium"},
    {"id": "k-5", "title": "Session browser with search", "status": "Inbox", "priority": "medium"},
    {"id": "k-6", "title": "Kanban drag-and-drop", "status": "Inbox", "priority": "low"},
    {"id": "k-7", "title": "Review event normalizer", "status": "Ready", "priority": "medium"},
    {"id": "k-8", "title": "Approval modal UX", "status": "Blocked", "priority": "high"},
]

_MEMORY = [
    {"key": "project.layout", "value": "monorepo with pnpm workspace"},
    {"key": "project.stack", "value": "Tauri v2 + React + TypeScript + Vite"},
    {"key": "adapter.port", "value": "39191"},
    {"key": "theme.format", "value": "TOML with extends inheritance"},
]

_LOG_LINES = [
    {"timestamp": "10:05:32", "level": "info", "message": "Adapter started on 127.0.0.1:39191"},
    {"timestamp": "10:05:33", "level": "info", "message": "Studio endpoints registered"},
    {"timestamp": "10:05:33", "level": "info", "message": "Theme loader initialized: 5 themes found"},
    {"timestamp": "10:05:34", "level": "info", "message": "Hermes health check: OK (mock v0.12.0)"},
    {"timestamp": "10:06:01", "level": "info", "message": "Run started: run_abc123"},
    {"timestamp": "10:06:02", "level": "info", "message": "Tool started: file_tree"},
    {"timestamp": "10:06:03", "level": "info", "message": "Tool completed: file_tree (1.2s)"},
    {"timestamp": "10:06:15", "level": "info", "message": "Run completed: run_abc123"},
    {"timestamp": "10:08:00", "level": "warn", "message": "Theme minecraft-overworld: missing accessibility.font_scale"},
    {"timestamp": "10:10:45", "level": "info", "message": "Session s-2 resumed"},
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _sse(event_type: str, data: Any) -> str:
    import json

    return f"event: {event_type}\ndata: {json.dumps(data)}\n\n"


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@router.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "healthy",
        "adapter_version": "0.1.0",
        "hermes_connected": False,
        "uptime_seconds": 0,
    }


# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------


@router.get("/bootstrap")
async def bootstrap(_token: None = Depends(require_token)) -> dict[str, Any]:
    return {
        "adapter_version": "0.1.0",
        "hermes_version": "0.12.0-mock",
        "active_profile": "coder",
        "capabilities": ["chat", "tools", "files", "approval", "streaming"],
        "recent_sessions": [s.model_dump(mode="json") for s in _SESSIONS],
        "active_theme": _THEMES[0].model_dump(),
        "available_models": [
            {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4", "provider": "Anthropic"},
            {"id": "gpt-4o", "name": "GPT-4o", "provider": "OpenAI"},
        ],
    }


# ---------------------------------------------------------------------------
# Profiles
# ---------------------------------------------------------------------------


@router.get("/profiles")
async def list_profiles(_token: None = Depends(require_token)) -> list[dict[str, Any]]:
    return [p.model_dump() for p in _PROFILES]


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------


@router.get("/sessions")
async def list_sessions(_token: None = Depends(require_token)) -> dict[str, Any]:
    return {
        "sessions": [s.model_dump(mode="json") for s in _SESSIONS],
        "total": len(_SESSIONS),
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    for s in _SESSIONS:
        if s.id == session_id:
            return {
                **s.model_dump(mode="json"),
                "transcript_preview": [
                    {"role": "user", "content": "Can you map the src directory structure?"},
                    {"role": "assistant", "content": "I'll explore the src directory structure for you."},
                ],
            }
    raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": f"Session '{session_id}' not found"}})


# ---------------------------------------------------------------------------
# Runs
# ---------------------------------------------------------------------------


@router.post("/runs")
async def start_run(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    run_id = f"run_{uuid.uuid4().hex[:12]}"
    _active_runs[run_id] = {
        "run_id": run_id,
        "session_id": body.get("session_id", "default"),
        "prompt": body.get("prompt", ""),
        "status": "started",
        "created_at": _now_iso(),
    }
    return {"run_id": run_id, "status": "started"}


@router.get("/runs/{run_id}/events")
async def stream_run_events(run_id: str, _token: None = Depends(require_token)) -> StreamingResponse:
    async def event_generator() -> AsyncIterator[str]:
        run = _active_runs.get(run_id)
        if not run:
            yield _sse("run.failed", {"run_id": run_id, "message": f"Run '{run_id}' not found", "error_code": "not_found"})
            return

        prompt = run.get("prompt", "")
        words = prompt.split() if prompt else ["I", "can", "help", "with", "that"]
        response_chunks = [f"Let me work on: ", *["" for _ in range(3)]]
        response_chunks = [
            "Let me work on that for you. ",
            "I'll analyze the request and ",
            "provide a detailed response ",
            "based on the current context.",
        ]

        # run.started
        if run_id in _run_cancelled:
            yield _sse("run.cancelled", {"run_id": run_id, "reason": "user_cancelled"})
            return
        yield _sse("run.started", {"run_id": run_id, "session_id": run["session_id"]})
        await asyncio.sleep(0.3)

        # assistant.delta chunks
        for chunk in response_chunks:
            if run_id in _run_cancelled:
                yield _sse("run.cancelled", {"run_id": run_id, "reason": "user_cancelled"})
                _run_cancelled.discard(run_id)
                return
            yield _sse("assistant.delta", {"text": chunk})
            await asyncio.sleep(0.2)

        # tool.started
        if run_id in _run_cancelled:
            yield _sse("run.cancelled", {"run_id": run_id, "reason": "user_cancelled"})
            return
        yield _sse("tool.started", {"tool": "file_tree", "tool_call_id": "tc_001"})
        await asyncio.sleep(0.3)

        # tool.progress
        for pct in (30, 70, 100):
            if run_id in _run_cancelled:
                yield _sse("run.cancelled", {"run_id": run_id, "reason": "user_cancelled"})
                return
            yield _sse("tool.progress", {"tool": "file_tree", "tool_call_id": "tc_001", "progress": pct / 100, "message": f"Scanning... {pct}%"})
            await asyncio.sleep(0.2)

        # tool.completed
        if run_id in _run_cancelled:
            yield _sse("run.cancelled", {"run_id": run_id, "reason": "user_cancelled"})
            return
        yield _sse("tool.completed", {"tool": "file_tree", "tool_call_id": "tc_001", "success": True, "duration_ms": 1200, "output": ["src/", "tests/", "README.md"]})
        await asyncio.sleep(0.3)

        # assistant.completed
        yield _sse("assistant.completed", {"model": "claude-sonnet-4-20250514", "total_tokens": 342, "duration_ms": 2100})
        await asyncio.sleep(0.2)

        # kanban.updated
        yield _sse("kanban.updated", {"board_id": "main", "action": "card_status_changed", "task_id": "k-2"})
        await asyncio.sleep(0.1)

        # memory.updated
        yield _sse("memory.updated", {"session_id": run["session_id"], "action": "created", "artifact_id": "mem_new_001"})
        await asyncio.sleep(0.1)

        # run.completed
        yield _sse("run.completed", {"run_id": run_id, "total_tokens": 342, "duration_ms": 2100, "tool_count": 1})

        # cleanup
        _active_runs.pop(run_id, None)
        _run_cancelled.discard(run_id)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/runs/{run_id}/stop")
async def stop_run(run_id: str, _token: None = Depends(require_token)) -> dict[str, Any]:
    if run_id in _active_runs:
        _run_cancelled.add(run_id)
        _active_runs[run_id]["status"] = "cancelled"
        return {"run_id": run_id, "status": "cancelled"}
    return {"run_id": run_id, "status": "not_found"}


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------


@router.get("/logs")
async def get_logs(_token: None = Depends(require_token)) -> dict[str, Any]:
    return {"source": "agent", "lines": [f"[{l['timestamp']}] [{l['level'].upper()}] {l['message']}" for l in _LOG_LINES], "total": len(_LOG_LINES)}


@router.get("/logs/stream")
async def stream_logs(_token: None = Depends(require_token)) -> StreamingResponse:
    async def log_generator() -> AsyncIterator[str]:
        messages = [
            ("info", "Heartbeat: adapter alive"),
            ("info", "Memory usage: 42MB"),
            ("info", "Active sessions: 1"),
            ("warn", "Theme cache expired, refreshing..."),
            ("info", "Theme cache refreshed"),
            ("info", "Hermes API check: healthy (mock)"),
            ("info", "Idle timeout: no active runs"),
            ("info", "Session s-1 updated: 13 messages"),
            ("info", "Tool registry: 4 tools available"),
            ("info", "Config watcher: no changes detected"),
        ]
        idx = 0
        while True:
            level, msg = messages[idx % len(messages)]
            yield _sse("log.line", {"source": "agent", "level": level, "message": msg, "timestamp": _now_iso()})
            idx += 1
            await asyncio.sleep(1.5)

    return StreamingResponse(log_generator(), media_type="text/event-stream")


# ---------------------------------------------------------------------------
# Themes
# ---------------------------------------------------------------------------


@router.get("/themes")
async def list_themes(_token: None = Depends(require_token)) -> dict[str, Any]:
    return {"themes": [t.model_dump() for t in _THEMES], "active": _ACTIVE_THEME_ID}


@router.post("/themes/activate")
async def activate_theme(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    global _ACTIVE_THEME_ID
    theme_id = body.get("theme_id", "")
    for t in _THEMES:
        if t.id == theme_id:
            _ACTIVE_THEME_ID = theme_id
            return t.model_dump()
    raise HTTPException(status_code=404, detail={"error": {"code": "not_found", "message": f"Theme '{theme_id}' not found"}})


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------


@router.get("/config")
async def get_config(_token: None = Depends(require_token)) -> dict[str, Any]:
    return {"config": _CONFIG}


@router.patch("/config")
async def patch_config(body: dict[str, Any], _token: None = Depends(require_token)) -> dict[str, Any]:
    key = body.get("key")
    value = body.get("value")
    if key:
        _CONFIG[key] = value
    return {"config": _CONFIG}

"""Tests for HermesBackend — real Hermes API integration."""

from __future__ import annotations

import asyncio
import json
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from hermes_adapter.hermes_backend import HermesBackend, _normalize_hermes_event

# ---------------------------------------------------------------------------
# Fake Hermes API server for testing
# ---------------------------------------------------------------------------


def _create_fake_hermes_app(healthy: bool = True) -> FastAPI:
    """Create a fake Hermes API server for testing."""
    app = FastAPI()
    _runs: dict[str, dict[str, Any]] = {}

    @app.get("/health")
    async def health():
        if healthy:
            return {"status": "ok", "version": "0.12.0"}
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="unavailable")

    @app.get("/v1/capabilities")
    async def capabilities():
        return {"capabilities": ["chat", "tools", "streaming"]}

    @app.post("/v1/runs")
    async def start_run(body: dict[str, Any]):
        import uuid
        run_id = f"run_{uuid.uuid4().hex[:8]}"
        _runs[run_id] = {"run_id": run_id, "status": "started", "session_id": body.get("session_id", "")}
        return {"run_id": run_id, "status": "started"}

    @app.get("/v1/runs/{run_id}/events")
    async def stream_events(run_id: str):
        async def generate():
            # Simulate OpenAI-compatible SSE stream
            chunks = [
                {"choices": [{"delta": {"role": "assistant"}}]},
                {"choices": [{"delta": {"content": "Hello "}}]},
                {"choices": [{"delta": {"content": "world!"}}]},
            ]
            for chunk in chunks:
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.05)
            yield "data: [DONE]\n\n"

        return StreamingResponse(generate(), media_type="text/event-stream")

    @app.post("/v1/runs/{run_id}/stop")
    async def stop_run(run_id: str):
        return {"run_id": run_id, "status": "cancelled"}

    return app


# ---------------------------------------------------------------------------
# Event normalization tests
# ---------------------------------------------------------------------------


class TestNormalizeHermesEvent:
    def test_openai_delta_format(self):
        raw = {"choices": [{"delta": {"content": "Hello "}}]}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "assistant.delta"
        assert result["payload"]["text"] == "Hello "

    def test_hermes_run_started(self):
        raw = {"type": "run.started", "payload": {"run_id": "r1", "session_id": "s1"}}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "run.started"
        assert result["payload"]["run_id"] == "r1"

    def test_hermes_tool_started(self):
        raw = {"type": "tool.started", "payload": {"tool": "bash", "tool_call_id": "tc1"}}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "tool.started"
        assert result["payload"]["tool"] == "bash"

    def test_hermes_tool_completed(self):
        raw = {"type": "tool.completed", "payload": {"tool": "bash", "success": True}}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "tool.completed"
        assert result["payload"]["success"] is True

    def test_hermes_run_completed(self):
        raw = {"type": "run.completed", "payload": {"run_id": "r1"}}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "run.completed"

    def test_hermes_run_completed_failure_becomes_run_failed(self):
        raw = {"type": "run.completed", "payload": {"run_id": "r1", "status": "failed", "error": "timeout"}}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "run.failed"
        assert result["payload"]["message"] == "timeout"

    def test_unknown_event_becomes_adapter_warning(self):
        raw = {"type": "some.future.event", "payload": {"data": "value"}}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "adapter.warning"
        assert "some.future.event" in result["payload"]["message"]

    def test_empty_event_becomes_adapter_warning(self):
        raw = {}
        result = _normalize_hermes_event(raw)
        assert result["type"] == "adapter.warning"


# ---------------------------------------------------------------------------
# HermesBackend tests with fake server
# ---------------------------------------------------------------------------


class TestHermesBackend:
    @pytest.fixture()
    def fake_hermes(self):
        """Start a fake Hermes server and return its URL."""
        import socket
        import threading

        import uvicorn

        # Find a free port
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", 0))
            port = s.getsockname()[1]

        app = _create_fake_hermes_app(healthy=True)

        server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="error"))
        thread = threading.Thread(target=server.run, daemon=True)
        thread.start()
        import time
        time.sleep(0.5)

        yield f"http://127.0.0.1:{port}"
        server.should_exit = True

    @pytest.fixture()
    def fake_hermes_unavailable(self):
        """Return URL of a non-existent Hermes server."""
        return "http://127.0.0.1:19999"

    async def test_health_success(self, fake_hermes):
        backend = HermesBackend(fake_hermes)
        health = await backend.health()
        assert health["hermes_connected"] is True
        assert health["backend_mode"] == "hermes"
        await backend.close()

    async def test_health_unavailable(self, fake_hermes_unavailable):
        backend = HermesBackend(fake_hermes_unavailable)
        health = await backend.health()
        assert health["hermes_connected"] is False
        assert health["status"] == "degraded"
        assert health["hermes_last_error"] is not None
        await backend.close()

    async def test_bootstrap_with_hermes(self, fake_hermes):
        backend = HermesBackend(fake_hermes)
        data = await backend.bootstrap()
        assert "adapter_version" in data
        assert "capabilities" in data
        await backend.close()

    async def test_start_run(self, fake_hermes):
        backend = HermesBackend(fake_hermes)
        result = await backend.start_run("s-1", "hello")
        assert result["status"] == "started"
        assert "run_id" in result
        await backend.close()

    async def test_stream_run_events(self, fake_hermes):
        backend = HermesBackend(fake_hermes)
        result = await backend.start_run("s-1", "hello")
        run_id = result["run_id"]

        events = []
        async for event in backend.stream_run_events(run_id):
            events.append(event)

        types = [e["type"] for e in events]
        assert "assistant.delta" in types
        assert "run.completed" in types
        await backend.close()

    async def test_stop_run(self, fake_hermes):
        backend = HermesBackend(fake_hermes)
        result = await backend.start_run("s-1", "hello")
        run_id = result["run_id"]

        stop_result = await backend.stop_run(run_id)
        assert stop_result["status"] == "cancelled"
        await backend.close()

    async def test_start_run_when_unavailable(self, fake_hermes_unavailable):
        backend = HermesBackend(fake_hermes_unavailable)
        result = await backend.start_run("s-1", "hello")
        assert result["status"] == "failed"
        assert "error" in result
        await backend.close()


# ---------------------------------------------------------------------------
# Auto mode fallback test
# ---------------------------------------------------------------------------


class TestAutoModeFallback:
    async def test_auto_falls_back_to_mock_when_hermes_unavailable(self):
        import os

        from hermes_adapter.backend_factory import create_backend

        # Force auto mode with unavailable Hermes
        os.environ["HERMES_STUDIO_BACKEND"] = "auto"
        os.environ["HERMES_API_BASE_URL"] = "http://127.0.0.1:19999"

        backend, status = await create_backend()
        assert status["backend_mode"] == "auto"
        assert status["active_backend"] == "mock"
        assert status["hermes_connected"] is False

        # Cleanup
        os.environ.pop("HERMES_STUDIO_BACKEND", None)
        os.environ.pop("HERMES_API_BASE_URL", None)

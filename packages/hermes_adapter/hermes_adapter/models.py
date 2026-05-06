"""Pydantic models for the Hermes Adapter API."""

from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ProfileInfo(BaseModel):
    """Information about an available Hermes profile."""

    name: str
    path: str


class SessionSummary(BaseModel):
    """Summary of a chat session."""

    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: int


class RunRequest(BaseModel):
    """Request to start a new run in a session."""

    session_id: str
    prompt: str
    profile: str | None = None


class RunResponse(BaseModel):
    """Response after starting a run."""

    run_id: str
    status: Literal["started", "queued", "failed"]


ShellEventType = Literal[
    "run.started",
    "assistant.delta",
    "assistant.completed",
    "tool.started",
    "tool.progress",
    "tool.completed",
    "approval.requested",
    "approval.resolved",
    "run.completed",
    "run.failed",
    "run.cancelled",
    "log.line",
    "adapter.warning",
]


class ShellEvent(BaseModel):
    """Normalized event emitted by the adapter shell."""

    type: ShellEventType
    payload: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ThemeInfo(BaseModel):
    """Metadata for an installed theme."""

    id: str
    name: str
    version: str
    author: str
    description: str


class ConfigView(BaseModel):
    """Key-value view of the current adapter configuration."""

    config: dict[str, Any] = Field(default_factory=dict)


class ErrorDetail(BaseModel):
    """Structured error response from the adapter."""

    code: str
    message: str
    retryable: bool = False
    source: str = "adapter"
    hint: str | None = None


class ErrorResponse(BaseModel):
    """Wrapper for error responses."""

    error: ErrorDetail


class ThemeActivateRequest(BaseModel):
    """Request to activate a theme."""

    theme_id: str


class BootstrapResponse(BaseModel):
    """Initial payload sent to the UI on bootstrap."""

    adapter_version: str
    hermes_version: str
    active_profile: str | None
    capabilities: list[str]
    recent_sessions: list[SessionSummary]
    active_theme: ThemeInfo | None

# Architecture

## Overview

Hermes Local Shell is a local-first, themeable UI shell for Hermes Agent. It does not modify Hermes core; instead, it wraps Hermes through public/local integration surfaces.

## Layers

```
┌─────────────────────────────────────────────┐
│ UI Frontend (Textual MVP / Ratatui future)  │
│  - Chat / Composer / Session Sidebar         │
│  - Tool Activity / Log Panel / Status Bar    │
│  - Theme/Layout selector                     │
└─────────────────────┬───────────────────────┘
                      │ HTTP/SSE (local only)
┌─────────────────────▼───────────────────────┐
│ Local Shell Adapter (Python)                │
│  - FastAPI server on 127.0.0.1:39191        │
│  - Token-based auth (rotated per launch)    │
│  - Event normalization                      │
│  - Hermes API client                        │
│  - Hermes CLI wrappers                      │
│  - Read-only local state observer           │
└─────────────────────┬───────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   Hermes API   Hermes CLI   Local State
   /v1/runs     config set   ~/.hermes/state.db
   SSE stream   sessions     ~/.hermes/logs
                logs         ~/.hermes/config.yaml
```

## Design Principles

1. **Adapter is the source of truth.** Frontends must not import Hermes internals.
2. **Stabilize the contract early.** The `/shell/*` API and event schema should change slowly.
3. **Read-only state access.** For sessions, logs, and config observation, prefer read-only access.
4. **Write via CLI wrappers.** For mutations, call official `hermes` CLI commands.
5. **Defensive event handling.** Normalize and sanitize Hermes SSE events; synthesize terminal events when upstream signaling is ambiguous.

## Package Layout

- `packages/hermes_adapter/` — Local API adapter. Owns the contract.
- `apps/textual_shell/` — Textual TUI frontend. Consumes the adapter contract.
- `themes/` — Data-driven theme packs and layout packs.
- `protocol/` — JSON Schema / OpenAPI contracts (future).

## Security

- Default bind: `127.0.0.1:39191`
- Token file: `~/.hermes-local-shell/runtime/token` with `0600` permissions
- Token rotated per adapter launch
- Adapter-to-Hermes token kept separate
- Unix domain socket preferred when available

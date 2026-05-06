# Adapter Contract

## Base URL

```
http://127.0.0.1:39191
```

All endpoints require Bearer token from `~/.hermes-local-shell/runtime/token`.

## Endpoints

### GET /shell/bootstrap
Returns adapter info, active profile, available models, recent sessions, and active theme.

### GET /shell/profiles
List Hermes profiles.

### GET /shell/sessions
List session metadata (read-only from state.db + transcripts).

### GET /shell/sessions/{session_id}
Session details and transcript summary.

### POST /shell/runs
Start a new run.

**Request:**
```json
{
  "session_id": "world-coder-main",
  "prompt": "src klasorunun yapisini ozetle",
  "profile": "coder"
}
```

**Response:**
```json
{
  "run_id": "run_...",
  "status": "started"
}
```

### GET /shell/runs/{run_id}/events
SSE stream of normalized events.

### POST /shell/runs/{run_id}/stop
Stop an active run.

### GET /shell/logs/stream
SSE stream of log lines.

### GET /shell/config
Normalized config view.

### PATCH /shell/config
Safe config mutation (wraps `hermes config set`).

### GET /shell/themes
List installed themes.

### POST /shell/themes/install
Install theme from path or GitHub.

### POST /shell/themes/activate
Activate theme + layout.

## Event Model

Normalized event types:

- `run.started`
- `assistant.delta`
- `assistant.completed`
- `tool.started`
- `tool.progress`
- `tool.completed`
- `approval.requested`
- `approval.resolved`
- `run.completed`
- `run.failed`
- `run.cancelled`
- `log.line`
- `adapter.warning`

## Error Envelope

```json
{
  "error": {
    "code": "HERMES_AUTH",
    "message": "Provider kimlik bilgileri gecersiz",
    "retryable": false,
    "source": "hermes",
    "hint": "hermes auth veya hermes model ile saglayici ayarlarini dogrula"
  }
}
```

## Auth

- Default: Unix domain socket or named pipe (preferred)
- Fallback: `127.0.0.1` + random bearer token
- Token file: `0600` permissions, rotated per launch
- Idempotency-Key header on POSTs by default

# Approval Center

Approval Center v1 is a Studio-owned visibility and audit layer for tool approval requests observed in run streams.

It does not answer approvals through Hermes, bypass Hermes approval mechanisms, modify Hermes config, or write Hermes `state.db`.

## Storage

Migration `6: persistent_approvals` creates:

- `approvals`
- `approval_events`

Approval records can link to:

- `run_id`
- `session_id`

Payloads are normalized and redacted before storage. Unknown or incomplete approval payloads are still recorded with `unknown` fields instead of breaking the run stream.

## Status And Risk

Supported statuses:

- `pending`
- `approved`
- `denied`
- `expired`
- `cancelled`
- `unknown`

Supported risk levels:

- `low`
- `medium`
- `high`
- `critical`
- `unknown`

## API

All Approval Center calls are protected `/studio/*` calls:

- `GET /studio/approvals`
- `GET /studio/approvals/pending`
- `GET /studio/approvals/{approval_id}`
- `GET /studio/runs/{run_id}/approvals`
- `GET /studio/sessions/{session_id}/approvals`

The adapter also exposes:

- `POST /studio/approvals/{approval_id}/approve`
- `POST /studio/approvals/{approval_id}/deny`

Those response routes intentionally return `501 Not Implemented` until a verified official Hermes approval response API is wired. The desktop UI treats Approval Center as read-only in v1.

The OpenAPI route parity test fails if these paths drift from `packages/protocol/openapi.yaml`.

## Event Capture

When a run stream emits normalized Studio events:

- `approval.requested`
- `approval.resolved`

the adapter records them in `studio.db`. Persistence failure logs a warning and may emit `adapter.warning`, but it must not break live SSE streaming.

## Frontend

Approval Center v1 supports:

- pending approval list
- approval history
- filters for pending, approved, denied, and high risk
- detail panel with tool, command/action, risk, reason, run/session links, request payload preview, status, and decision
- pending count badge in the activity rail and status bar
- Run Ledger action to open approvals for the selected run
- Context Inspector related approvals for selected run/session context

The UI must not claim approve/deny works until the adapter is connected to a verified Hermes approval response API.

## Security Rules

- Do not write approval data to Hermes `state.db`.
- Do not write Hermes config/profile files.
- Do not store secrets, tokens, API keys, auth headers, or passwords.
- Redact obvious secret-like values from approval payloads.
- Treat model/tool payloads as untrusted.
- Do not implement automatic approval, blanket approval, or approval bypass.

## Future Work

Future layers can add real approve/deny actions only after Hermes Agent exposes and documents a safe local approval response API. Until then, Approval Center remains an audit and visibility surface.

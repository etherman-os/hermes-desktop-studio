# Studio Artifacts

Artifact Shelf stores persistent Studio-owned metadata for useful outputs from runs, sessions, cards, logs, tests, reports, markdown, JSON, screenshots, HTML source, and file references.

Artifacts live in Studio-owned `studio.db`. They are not Hermes Agent state, and Studio must never write them to Hermes `state.db`.

## Storage

Migration `5: persistent_artifacts` creates:

- `artifacts`
- `artifact_events`

Artifact records can link to:

- `run_id`
- `session_id`
- `kanban_card_id`

File artifacts are references only. Studio stores path metadata and a display filename; it does not copy arbitrary files into SQLite.

## Types

Supported artifact types:

- `markdown`
- `text`
- `log_snapshot`
- `test_result`
- `report`
- `html`
- `screenshot`
- `file_reference`
- `json`
- `unknown`

## API

All artifact calls are protected `/studio/*` calls:

- `GET /studio/artifacts`
- `GET /studio/artifacts/{artifact_id}`
- `POST /studio/artifacts`
- `PATCH /studio/artifacts/{artifact_id}`
- `POST /studio/artifacts/{artifact_id}/archive`
- `POST /studio/artifacts/{artifact_id}/link-run`
- `POST /studio/artifacts/{artifact_id}/link-session`
- `POST /studio/artifacts/{artifact_id}/link-card`

The OpenAPI route parity test fails if these paths drift from `packages/protocol/openapi.yaml`.

## Security Rules

- Do not write artifact data to Hermes `state.db`.
- Do not store secrets, tokens, API keys, auth headers, or passwords.
- Redact obvious secret-like values from text artifacts.
- Keep text content small and bounded.
- Store file references as metadata only.
- Do not execute artifact HTML or scripts.
- Show HTML as inert source text until a sanitizer-backed preview canvas exists.
- Treat model output as untrusted; persistent artifact creation should come from structured user or app intent.

## Frontend

Artifact Shelf v1 supports:

- list and search persisted artifacts
- filter by artifact type
- inspect detail metadata and content
- create manual artifacts
- archive artifacts
- create run summary, log snapshot, and markdown report artifacts from Run Ledger
- create session summary artifacts from Sessions
- create card summary artifacts from Board
- inspect related run/session context through Context Inspector

Markdown is rendered using safe React text nodes. JSON is pretty printed. Logs and HTML source are shown as inert monospaced text. File references show path metadata and an "Open file" placeholder.

Context Inspector can show artifacts linked to a selected run or session. This relationship is read-only from the context surface; artifact writes still go only through `/studio/artifacts/*`.

## Future Work

Future layers can add:

- Preview Canvas for sanitized previews
- artifact extraction from real run outputs
- screenshot capture
- test result parsing
- checkpoint/diff references
- richer card/run/session artifact relationship views

Those layers should keep the same Studio-owned storage boundary.

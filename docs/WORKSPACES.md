# Studio Workspaces

A Studio workspace is a local project folder/path used as context for starting a new run.

Phase UX-2 keeps workspaces deliberately small:

- selected workspace path in the top bar and status bar
- manual path selection through the Workspace picker
- recent workspace list stored locally in the desktop frontend
- New Run modal includes workspace path
- Run Ledger displays persisted workspace metadata

Workspace paths are Studio-owned metadata in `studio.db`. They are not written to Hermes `state.db`.

## Hermes Runtime Boundary

Hermes Agent v0.12.0 has not been verified to accept a cwd/workspace field on `/v1/runs`. Studio therefore does not invent one or forward arbitrary workspace fields to Hermes. The adapter stores the workspace path beside the run record for user orientation and future integration.

When Hermes exposes an official safe workspace/cwd field, the adapter can translate the Studio metadata inside the HermesBackend layer.

## New Run Flow

1. Select a workspace path from the top bar or New Run modal.
2. Enter a prompt.
3. Choose run mode placeholder: chat, task, review, or debug.
4. Optionally choose a session or enter a related card id.
5. Submit through `POST /studio/runs`.

The Run Ledger remains the operational record. Chat is the prompt/conversation surface.

# UI Direction

The desktop UI should feel like a compact operations workbench.

## Current Direction

- Default surface: Mission Control.
- Chat is a prompt panel, not the whole product.
- Board is a run/session/artifact control surface, not a standalone todo app.
- Right panel acts as an inspector for selected run, model, tools, memory, context, approvals, and diagnostics.
- Bottom panel is operational output: activity, tool events, logs, and adapter diagnostics.
- Themes provide semantic labels/icons, visual tone, and animated concept-pack ambience, but the workbench structure remains stable.

## Near-Term Surfaces

- Run Ledger: current/last run, event timeline, selected event payload.
- Mission Control: runtime command center for local CLI, optional gateway bridge, recent runs, approvals, processes, delegations, and capability inventory.
- Design Canvas: import HTML, screenshots notes, URLs, JSON specs, and markdown briefs, then send a structured design handoff to Hermes.
- Artifact Shelf: categories for files, markdown, screenshots, tests, log snapshots, sanitized HTML previews, design actions, browser evidence requests, and reports.
- Context Inspector: read-only active profile, model/provider, workspace files, memory/skills availability, runtime warnings, and related runs/sessions/cards/artifacts.
- Approval Center: pending/history, risk/status, run/session links, local decisions, and Hermes notification state.
- Process Cockpit: template grid, process cards, real-time logs, start/stop controls.
- Extensions Panel: tool pack discovery, enable/disable, pack detail with tool list.
- Checkpoint Timeline: git commit history, diff previews, checkpoint creation.
- Worktree Launcher: worktree list, creation, external editor integration.
- Delegation Panel: sub-agent tracking, parent run context, delegation status.
- Cron Panel: scheduled jobs from ~/.hermes/cron/, schedule display, run history.
- Preview Canvas: second window for URL preview and artifact rendering.

## Guardrails

- Do not make the UI a generic dashboard.
- Do not make Chat the main product.
- Do not implement drag-and-drop Kanban before the run-centered workflow is clear.
- Do not start animated concept-pack runtime before the workbench structure is stable.
- Do not hardcode example theme concepts in core components.

## Phase UX-2 Shell Direction

The shell should read as a desktop workbench:

- Top bar: app identity, current workspace, New Run, runtime chips, command palette.
- Activity rail: stable activities for Mission, Runs, Chat, Board, Sessions, Design, Artifacts, Processes, Context, Approvals, Hermes Arsenal, Delegations, Cron, Logs, Themes, Settings.
- Contextual sidebar: activity-specific navigation and actions.
- Center workbench: Run Ledger remains primary, Chat is one surface.
- Right inspector: runtime, selected run, model, tools, approvals, memory, context.
- Bottom panel: activity, tools, logs, adapter diagnostics.

Runtime state must be explicit. MockBackend should never look like real Hermes. Auto fallback should show why it fell back. In local mode, Studio maps workspace path, provider/model, skills, toolsets, checkpoints, max turns, worktree, and session flags to public Hermes CLI options. When Studio sends optional run context through gateway mode, the HermesBackend must retry with a minimal payload if the installed Hermes gateway rejects those fields.

## QA Runtime Boundary

The real product runtime is the Tauri desktop app. Browser/Vite rendering is useful for fast frontend QA, but it is not the shipping runtime and should not drive product architecture.

Use `pnpm run tauri dev` for the desktop window. Use `pnpm run test:visual:firefox` only as an optional render smoke that verifies the shell can render in a browser and writes screenshots to `artifacts/visual-smoke/` when available.

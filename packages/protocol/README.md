# protocol

API schemas and contracts for Hermes Desktop Studio.

## Files

| File | Description |
|------|-------------|
| `openapi.yaml` | Adapter API specification (all `/studio/*` endpoints) — OpenAPI 3.1 |
| `events.schema.json` | Normalized event types (15 events) — JSON Schema |
| `theme.schema.json` | Theme pack TOML schema — generic concept pack system |
| `layout.schema.json` | Layout pack TOML schema — panel geometry and configuration |
| `plugin.schema.json` | Plugin manifest schema — theme-pack, layout-pack (active), panel-pack, command-pack, kanban-pack (future) |

## Endpoint Prefix

All adapter endpoints use `/studio/` prefix (not `/shell/`). The `/shell/` prefix is legacy and will be migrated in a future phase.

## Event System

Events are normalized by the adapter. The desktop UI must never consume raw Hermes SSE events directly. The adapter may synthesize events (e.g., `run.failed`) when Hermes signaling is ambiguous.

## Theme System

The theme system is generic and semantic-slot-based. No concept (Minecraft, Minions, LOTR, etc.) is hardcoded into the schemas. Themes map stable semantic keys to their own visual language.

## Plugin Types

| Type | MVP Status | Description |
|------|-----------|-------------|
| `theme-pack` | Active | Colors, icons, labels, styles |
| `layout-pack` | Active | Panel geometry, visibility, density |
| `panel-pack` | Future | Custom panel components |
| `command-pack` | Future | Custom commands for palette |
| `kanban-pack` | Future | Custom kanban views and workflows |

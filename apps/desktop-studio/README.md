# Hermes Desktop Studio

A local-first, themeable desktop studio for [Hermes Agent](https://github.com/NousResearch/hermes-agent).

## Stack

- **Tauri v2** — Desktop app framework (Rust host)
- **React 19** — UI framework
- **TypeScript** — Type-safe frontend
- **Vite 6** — Build tool and dev server
- **Zustand** — Client state management
- **CSS variables** — Theme tokens

## Development

```bash
# Install dependencies
pnpm install

# Start frontend dev server only
pnpm --filter @hermes-desktop-studio/desktop-studio dev

# Start Tauri desktop app (opens native window)
pnpm --filter @hermes-desktop-studio/desktop-studio tauri dev

# Build frontend
pnpm --filter @hermes-desktop-studio/desktop-studio build

# Build Tauri desktop app
pnpm --filter @hermes-desktop-studio/desktop-studio tauri build
```

## Architecture

```
┌─────────────────────────────────────────────┐
│ Desktop Studio (Tauri v2 + React + TS)      │
│  App Frame / Sidebar / Workbench / Panels   │
└──────────────────────┬──────────────────────┘
                       │ HTTP/SSE (local only)
┌──────────────────────▼──────────────────────┐
│ Local Shell Adapter (Python)                │
│  FastAPI on 127.0.0.1:39191                 │
└──────────────────────┬──────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Hermes API     Hermes CLI    Local State
   /v1/runs       config/set    ~/.hermes/state.db
   SSE stream     sessions      ~/.hermes/logs
```

## Theme System

Hermes Desktop Studio uses a generic, semantic-slot-based theme system.
No concept (Minecraft, Minions, LOTR, etc.) is hardcoded.

Theme packs can override: colors, icons, labels, panel names, typography,
empty states, onboarding copy, kanban styling, density, and decorative assets.

The core app uses stable semantic keys: `profiles`, `sessions`, `chat`,
`kanban`, `artifacts`, `tools`, `memory`, `logs`, `activity`, `inspector`,
`command_palette`, `settings`, `theme_gallery`.

## Status

Faz 2 (Desktop Studio Skeleton) — UI shell with mock data.
No real Hermes integration yet. Adapter connection comes in a later phase.

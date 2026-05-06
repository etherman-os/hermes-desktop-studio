# Hermes Local Shell

A local-first, themeable UI shell for [Hermes Agent](https://github.com/NousResearch/hermes-agent).

Hermes Local Shell keeps Hermes Agent's core untouched and adds a modern, customizable interface for users who run Hermes primarily on their own machine.

Use the clean default interface or build your own concept-driven layout — Minecraft, cyberpunk, minimal, hacker, anything.

## Quick Start

```bash
# Install in isolated environment (recommended)
pipx install hermes-local-shell

# Or install in editable mode for development
pip install -e ".[dev]"

# Start the local adapter
hermes-local-adapter

# In another terminal, start the UI
hermes-local-shell
```

## Architecture

```
┌──────────────────────────────┐
│ Textual UI (or Ratatui later)│
│ Chat / Sessions / Themes     │
└───────────────┬──────────────┘
                │
                ▼
┌──────────────────────────────┐
│ Local Shell Adapter          │
│ FastAPI + SSE + Pydantic     │
│ 127.0.0.1:39191              │
└───────────────┬──────────────┘
                │
   ┌────────────┼────────────┐
   ▼            ▼            ▼
Hermes API   Hermes CLI   Hermes local state
/v1/runs     config/logs  ~/.hermes/state.db
SSE stream   sessions     ~/.hermes/logs
```

## Core Principles

- **Do not modify Hermes core.** Wrap it through public/local integration surfaces only.
- **Adapter-first:** UI never talks to Hermes directly; it talks to the local adapter.
- **Theme + Layout separation:** Colors/icons/labels in theme packs; panel geometry in layout packs.
- **Local-only by default:** Bind 127.0.0.1, rotate tokens per launch, never expose without key.
- **Future-proof:** Same adapter contract supports Textual MVP today, Ratatui/Tauri tomorrow.

## Project Structure

```
hermes-local-shell/
  apps/
    textual_shell/          # Textual TUI frontend
  packages/
    hermes_adapter/         # Local API adapter (source of truth)
  themes/
    default-dark/
    minecraft-overworld/
  docs/
    ARCHITECTURE.md
    THEME_SYSTEM.md
    ADAPTER_CONTRACT.md
    ROADMAP.md
  scripts/
    dev.sh
    run-adapter.sh
    run-ui.sh
```

## License

MIT

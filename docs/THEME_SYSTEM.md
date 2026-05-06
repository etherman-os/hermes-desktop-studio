# Theme System

## Concepts

The theme system is split into three layers:

| Layer | What it changes | Code required? |
|-------|-----------------|----------------|
| **Theme pack** | Colors, icons, borders, text labels, panel appearance | No |
| **Layout pack** | Left/right panel widths, hidden/visible components, density modes | No |
| **Widget plugin** | New panels or custom visual components | Later |

In MVP, only Theme pack and Layout pack are supported.

## Override Order

1. Built-in base theme
2. Selected theme pack
3. Selected layout pack
4. Profile override (`$HERMES_HOME/ui-shell/overrides.toml`)
5. Workspace override (`.hermes-shell.toml`)
6. Runtime ephemeral override (`:theme set` or settings panel)

## Theme Pack Format (TOML)

```toml
[meta]
id = "minecraft-overworld"
name = "Minecraft Overworld"
version = "0.1.0"
author = "community"
extends = "default-dark"
description = "..."

[compat]
shell_api = "^1.0"
adapter_api = "^1.0"
min_hermes = "0.11.0"

[palette]
bg = "#1a1d14"
surface = "#2f3b1f"
text = "#eef6d2"
accent = "#7cb342"

[borders]
style = "blocky"
horizontal = "█"
vertical = "█"

[icons]
profile = "🌍"
session = "🧭"
tools = "⛏"

[labels]
profiles = "Dünyalar"
sessions = "Ender Chest"

[chat]
assistant_prefix = "🧙 Hermes"
user_prefix = "🧑 Oyuncu"

tool_prefix = "⛏ Araç"
```

## Layout Pack Format (TOML)

```toml
[layout]
mode = "triple-pane"
left_width = 22
right_width = 26
bottom_height = 4
show_logs_panel = true
show_memory_panel = true
show_tool_activity = true
message_style = "stacked-blocks"
tool_progress_style = "chips"

[panels]
left = ["profiles", "sessions", "themes"]
center = ["chat", "composer"]
right = ["model", "tools", "memory"]
bottom = ["logs", "tool_activity"]
```

## Assets

Each theme pack should include:
- `preview.txt` — ASCII/ANSI preview for theme browser
- (Optional) `screenshot.ansi` or `palette.png`

## Hermes Skin Import

Hermes YAML skins can be imported with a mapping:

| Hermes field | Shell field |
|--------------|-------------|
| `colors.response_border` | `palette.border` |
| `colors.status_bar_bg` | `palette.status_bg` |
| `branding.response_label` | `chat.assistant_prefix` |
| `tool_emojis.*` | `icons.*` |
| `banner_logo` | `assets.banner` |

## Commands

```bash
# List installed themes
hermes-local-shell theme list

# Install from local path
hermes-local-shell theme install ./my-theme

# Install from GitHub
hermes-local-shell theme install gh:owner/repo

# Import Hermes YAML skin
hermes-local-shell theme import-hermes ~/.hermes/skins/ares.yaml

# Enable theme for profile
hermes-local-shell theme enable minecraft-overworld --profile coder
```

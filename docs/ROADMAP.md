# Roadmap

## Phase 1 — MVP (Python + Textual)

- [x] Repo structure
- [x] pyproject.toml + packaging
- [ ] Adapter core (bootstrap, runs, SSE, stop, sessions, logs, config)
- [ ] Event normalization
- [ ] Textual MVP (chat, composer, sidebar, tool chips, log panel, status bar)
- [ ] Theme engine (TOML loader, hot reload, Hermes YAML import)
- [ ] Default-dark theme
- [ ] Minecraft-overworld theme
- [ ] Contract + UI tests
- [ ] pipx installable package

## Phase 2 — Hardening

- [ ] Real Hermes API integration (health, capabilities, /v1/runs, SSE)
- [ ] Profile/world switcher UI
- [ ] Approval modal
- [ ] Session browser with search
- [ ] Log inspector with filters
- [ ] Slash completion
- [ ] Embedded PTY fallback mode
- [ ] PyInstaller binary builds

## Phase 3 — Second Frontends

- [ ] Rust + Ratatui frontend (same adapter contract)
- [ ] Tauri + Svelte desktop shell (settings studio, theme browser)

## Phase 4 — Ecosystem

- [ ] Theme registry / marketplace
- [ ] Visual theme editor
- [ ] Widget plugin system
- [ ] ACP bridge panel
- [ ] Voice mode surface
- [ ] Homebrew tap / Debian .deb

import type { ThemePack } from "@hermes-studio/shared-types";

export function applyThemeToDOM(theme: ThemePack) {
  const root = document.documentElement;
  const p = theme.palette ?? {};

  const mapping: Record<string, string | undefined> = {
    "--app-bg": p.bg,
    "--app-surface": p.surface,
    "--app-surface-alt": p.surface_alt,
    "--app-panel": p.panel,
    "--app-border": p.border,
    "--app-border-subtle": p.border_subtle,
    "--app-text": p.text,
    "--app-text-secondary": p.text_secondary,
    "--app-text-muted": p.text_muted,
    "--app-accent": p.accent,
    "--app-accent-alt": p.accent_alt,
    "--app-accent-subtle": p.accent_subtle,
    "--app-ok": p.ok,
    "--app-warn": p.warn,
    "--app-danger": p.danger,
    "--app-info": p.info,
    "--kanban-todo": p.kanban_todo,
    "--kanban-doing": p.kanban_doing,
    "--kanban-done": p.kanban_done,
    "--kanban-blocked": p.kanban_blocked,
  };

  for (const [cssVar, value] of Object.entries(mapping)) {
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  }
}

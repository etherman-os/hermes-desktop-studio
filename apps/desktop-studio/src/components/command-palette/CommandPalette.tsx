import React from "react";
import { useUiStore } from "../../stores/uiStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { useThemeStore } from "../../stores/themeStore";

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen);
  const close = useUiStore((s) => s.closeCommandPalette);
  const query = useUiStore((s) => s.commandPaletteQuery);
  const setQuery = useUiStore((s) => s.setCommandPaletteQuery);
  const selectedIndex = useUiStore((s) => s.selectedCommandIndex);
  const setSelected = useUiStore((s) => s.setSelectedCommandIndex);

  const toggleRight = useLayoutStore((s) => s.toggleRightPanel);
  const toggleBottom = useLayoutStore((s) => s.toggleBottomPanel);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const setSidebar = useLayoutStore((s) => s.setSidebarSection);
  const setTheme = useThemeStore((s) => s.setTheme);

  const commands = [
    { id: "switch-theme", label: "Switch Theme", icon: "🎨", action: () => { setSidebar("theme_gallery"); close(); } },
    { id: "new-session", label: "New Session", icon: "➕", action: () => close() },
    { id: "open-kanban", label: "Open Kanban", icon: "📋", shortcut: "Ctrl+2", action: () => { setActiveTab("kanban"); close(); } },
    { id: "open-chat", label: "Open Chat", icon: "💬", shortcut: "Ctrl+1", action: () => { setActiveTab("chat"); close(); } },
    { id: "show-logs", label: "Show Logs", icon: "📜", shortcut: "Ctrl+4", action: () => { useLayoutStore.getState().setBottomTab("logs"); close(); } },
    { id: "open-settings", label: "Open Settings", icon: "⚙️", action: () => { setSidebar("settings"); close(); } },
    { id: "toggle-right", label: "Toggle Right Panel", icon: "📐", action: () => { toggleRight(); close(); } },
    { id: "toggle-bottom", label: "Toggle Bottom Panel", icon: "📏", action: () => { toggleBottom(); close(); } },
    { id: "theme-default", label: "Theme: Default Dark", icon: "🌙", action: () => { setTheme("default-dark"); close(); } },
    { id: "theme-minecraft", label: "Theme: Minecraft Overworld", icon: "🌍", action: () => { setTheme("minecraft-overworld"); close(); } },
    { id: "theme-minions", label: "Theme: Minions", icon: "😈", action: () => { setTheme("example-minions"); close(); } },
    { id: "theme-lotr", label: "Theme: Lord of the Rings", icon: "🏔️", action: () => { setTheme("example-lotr"); close(); } },
    { id: "theme-light", label: "Theme: Minimal Light", icon: "☀️", action: () => { setTheme("minimal-light"); close(); } },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { close(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(Math.min(selectedIndex + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(Math.max(selectedIndex - 1, 0)); }
      if (e.key === "Enter" && filtered[selectedIndex]) { filtered[selectedIndex].action(); }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, selectedIndex, filtered, close, setSelected]);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={close}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          className="command-palette-input"
          placeholder="Type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        <div className="command-palette-list">
          {filtered.map((cmd, i) => (
            <button
              key={cmd.id}
              className={`command-palette-item ${i === selectedIndex ? "selected" : ""}`}
              onClick={() => cmd.action()}
              onMouseEnter={() => setSelected(i)}
            >
              <span className="command-palette-item-icon">{cmd.icon}</span>
              <span className="command-palette-item-label">{cmd.label}</span>
              {cmd.shortcut && <span className="command-palette-item-shortcut">{cmd.shortcut}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

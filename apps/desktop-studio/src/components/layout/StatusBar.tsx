import { useThemeStore } from "../../stores/themeStore";

export function StatusBar() {
  const activeTheme = useThemeStore((s) => s.activeTheme);

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-dot" />
        <span>coder</span>
      </div>
      <div className="status-item">
        <span>~/Projects/hermes-desktop-studio</span>
      </div>
      <div className="status-item">
        <span>claude-sonnet-4</span>
      </div>
      <div style={{ flex: 1 }} />
      <div className="status-item">
        <span>{activeTheme().meta.name}</span>
      </div>
      <div className="status-item">
        <span>v0.1.0</span>
      </div>
    </div>
  );
}

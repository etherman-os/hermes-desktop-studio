import { useThemeStore } from "../../stores/themeStore";
import { useAdapterStore } from "../../stores/adapterStore";

export function StatusBar() {
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const connected = useAdapterStore((s) => s.connected);
  const checking = useAdapterStore((s) => s.checking);

  const statusColor = connected ? "var(--app-ok)" : checking ? "var(--app-warn)" : "var(--app-danger)";
  const statusText = connected ? "Connected" : checking ? "Checking..." : "Disconnected";

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
        <span className="status-dot" style={{ background: statusColor }} />
        <span>Adapter: {statusText}</span>
      </div>
      <div className="status-item">
        <span>{activeTheme().meta.name}</span>
      </div>
      <div className="status-item">
        <span>v0.1.0</span>
      </div>
    </div>
  );
}

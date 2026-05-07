import { useAdapterStore } from "../../stores/adapterStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { useProfileStore } from "../../stores/profileStore";
import { useThemeStore } from "../../stores/themeStore";
import { useUiStore } from "../../stores/uiStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";

export function TopBar() {
  const openNewRun = useUiStore((s) => s.openNewRun);
  const openPalette = useUiStore((s) => s.openCommandPalette);
  const openWorkspacePicker = useUiStore((s) => s.openWorkspacePicker);
  const toggleRightPanel = useLayoutStore((s) => s.toggleRightPanel);
  const toggleBottomPanel = useLayoutStore((s) => s.toggleBottomPanel);
  const toggleSidebar = useLayoutStore((s) => s.toggleSidebar);
  const selectedWorkspace = useWorkspaceStore((s) => s.selectedWorkspace);
  const connected = useAdapterStore((s) => s.connected);
  const backendMode = useAdapterStore((s) => s.backendMode);
  const activeBackend = useAdapterStore((s) => s.activeBackend);
  const hermesConnected = useAdapterStore((s) => s.hermesConnected);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const activeTheme = useThemeStore((s) => s.activeTheme);

  const backendLabel = backendMode === "auto" ? `auto/${activeBackend}` : backendMode;
  const runtimeTone = connected && (activeBackend === "hermes" || backendMode === "hermes") && hermesConnected
    ? "ok"
    : activeBackend === "mock" || backendMode === "mock"
      ? "warn"
      : connected
        ? "warn"
        : "danger";

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <div className="app-mark">Hermes Desktop Studio</div>
        <button className="topbar-button primary" onClick={openNewRun}>New Run</button>
        <button className="topbar-button" onClick={openWorkspacePicker}>
          <span className="topbar-label">Workspace</span>
          <span className="topbar-value">{selectedWorkspace ?? "Select folder"}</span>
        </button>
      </div>
      <div className="top-bar-center">
        <span className={`runtime-chip ${runtimeTone}`}>Backend {backendLabel}</span>
        <span className="runtime-chip">Profile {activeProfile?.name ?? "unknown"}</span>
        <span className="runtime-chip">Theme {activeTheme().meta.name}</span>
      </div>
      <div className="top-bar-right">
        <button className="icon-button" onClick={toggleSidebar} title="Toggle sidebar">S</button>
        <button className="icon-button" onClick={toggleBottomPanel} title="Toggle bottom panel">B</button>
        <button className="icon-button" onClick={toggleRightPanel} title="Toggle inspector">I</button>
        <button className="topbar-button" onClick={openPalette}>Command Palette Ctrl+K</button>
      </div>
    </div>
  );
}

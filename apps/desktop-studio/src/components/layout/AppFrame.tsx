import React from "react";
import { useLayoutStore } from "../../stores/layoutStore";
import { useThemeStore } from "../../stores/themeStore";
import { useUiStore } from "../../stores/uiStore";
import { useAdapterStore } from "../../stores/adapterStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useProfileStore } from "../../stores/profileStore";
import { useLogStore } from "../../stores/logStore";
import { useRunLedgerStore } from "../../stores/runLedgerStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { LeftRail } from "./LeftRail";
import { LeftSidebar } from "./LeftSidebar";
import { CenterArea } from "./CenterArea";
import { RightPanel } from "./RightPanel";
import { BottomPanel } from "./BottomPanel";
import { StatusBar } from "./StatusBar";
import { TopBar } from "./TopBar";
import { CommandPalette } from "../command-palette/CommandPalette";
import { NewRunModal } from "../runs/NewRunModal";
import { WorkspacePicker } from "../workspace/WorkspacePicker";

export function AppFrame() {
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const showRight = useLayoutStore((s) => s.showRightPanel);
  const showBottom = useLayoutStore((s) => s.showBottomPanel);
  const openPalette = useUiStore((s) => s.openCommandPalette);
  const checkConnection = useAdapterStore((s) => s.checkConnection);
  const loadSessions = useSessionStore((s) => s.loadFromAdapter);
  const loadProfiles = useProfileStore((s) => s.loadProfiles);
  const loadLogs = useLogStore((s) => s.loadRecent);
  const loadRecentRuns = useRunLedgerStore((s) => s.loadRecentRuns);
  const initTheme = useThemeStore((s) => s.initTheme);
  const loadThemes = useThemeStore((s) => s.loadThemes);
  const loadWorkspace = useWorkspaceStore((s) => s.load);

  React.useEffect(() => {
    loadWorkspace();
    initTheme();
    checkConnection().then((ok) => {
      if (ok) {
        loadSessions();
        loadProfiles();
        loadLogs();
        loadThemes();
        loadRecentRuns();
      }
    });
  }, [loadWorkspace, initTheme, checkConnection, loadSessions, loadProfiles, loadLogs, loadThemes, loadRecentRuns]);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openPalette();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openPalette]);

  return (
    <>
      <div className={`app-frame ${showBottom ? "bottom-open" : "bottom-collapsed"} ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${showRight ? "" : "right-collapsed"}`}>
        <TopBar />
        <LeftRail />
        {!sidebarCollapsed && <LeftSidebar />}
        <CenterArea />
        {showRight && <RightPanel />}
        {showBottom && <BottomPanel />}
        <StatusBar />
      </div>
      <CommandPalette />
      <NewRunModal />
      <WorkspacePicker />
    </>
  );
}

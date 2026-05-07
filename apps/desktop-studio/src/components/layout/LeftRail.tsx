import { useLayoutStore } from "../../stores/layoutStore";
import { useApprovalStore } from "../../stores/approvalStore";
import { useThemeStore } from "../../stores/themeStore";

const RAIL_ITEMS = [
  { id: "runs", slot: "runs" },
  { id: "chat", slot: "chat" },
  { id: "board", slot: "board" },
  { id: "sessions", slot: "sessions" },
  { id: "artifacts", slot: "artifacts" },
  { id: "context", slot: "context" },
  { id: "approvals", slot: "approvals" },
  { id: "logs", slot: "logs" },
  { id: "theme_gallery", slot: "theme_gallery" },
  { id: "settings", slot: "settings" },
];

export function LeftRail() {
  const setSidebar = useLayoutStore((s) => s.setSidebarSection);
  const showSidebar = useLayoutStore((s) => s.showSidebar);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const setBottomTab = useLayoutStore((s) => s.setBottomTab);
  const sidebarSection = useLayoutStore((s) => s.sidebarSection);
  const activeTab = useLayoutStore((s) => s.activeTab);
  const pendingApprovals = useApprovalStore((s) => s.pending.length);
  const icon = useThemeStore((s) => s.icon);
  const label = useThemeStore((s) => s.label);

  function handleClick(id: string) {
    if (["runs", "chat", "board", "sessions", "artifacts"].includes(id)) {
      setActiveTab(id);
    }
    if (id === "logs") {
      setBottomTab("logs");
    }
    setSidebar(id);
    showSidebar();
  }

  return (
    <div className="rail">
      {RAIL_ITEMS.map((item) => (
        <button
          key={item.id}
          className={`rail-icon ${sidebarSection === item.id || activeTab === item.id ? "active" : ""}`}
          onClick={() => handleClick(item.id)}
          title={label(item.slot)}
        >
          {icon(item.slot)}
          {item.id === "approvals" && pendingApprovals > 0 && <span className="rail-badge">{pendingApprovals}</span>}
        </button>
      ))}
    </div>
  );
}

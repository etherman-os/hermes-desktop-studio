import { useLayoutStore } from "../../stores/layoutStore";
import { useThemeStore } from "../../stores/themeStore";
import { ChatSurface } from "../chat/ChatSurface";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { SessionsPanel } from "../sessions/SessionsPanel";

const TABS = ["chat", "kanban", "artifacts", "sessions"] as const;

export function CenterArea() {
  const activeTab = useLayoutStore((s) => s.activeTab);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const label = useThemeStore((s) => s.label);

  return (
    <div className="center-area">
      <div className="center-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`center-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {label(tab)}
          </button>
        ))}
      </div>
      <div className="center-content">
        {activeTab === "chat" && <ChatSurface />}
        {activeTab === "kanban" && <KanbanBoard />}
        {activeTab === "artifacts" && <EmptySlot slot="artifacts" />}
        {activeTab === "sessions" && <SessionsPanel />}
      </div>
    </div>
  );
}

function EmptySlot({ slot }: { slot: string }) {
  const label = useThemeStore((s) => s.label);
  const icon = useThemeStore((s) => s.icon);
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon(slot)}</div>
      <div className="empty-state-text">{label(slot)} — coming soon</div>
    </div>
  );
}

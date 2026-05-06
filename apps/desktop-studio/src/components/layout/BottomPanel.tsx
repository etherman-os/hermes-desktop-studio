import { useLayoutStore } from "../../stores/layoutStore";
import { useThemeStore } from "../../stores/themeStore";
import { mockLogs, mockActivity } from "../../fixtures/mockData";

export function BottomPanel() {
  const bottomTab = useLayoutStore((s) => s.bottomTab);
  const setBottomTab = useLayoutStore((s) => s.setBottomTab);
  const label = useThemeStore((s) => s.label);

  return (
    <div className="bottom-panel">
      <div className="bottom-tabs">
        {(["activity", "logs", "tools"] as const).map((tab) => (
          <button
            key={tab}
            className={`bottom-tab ${bottomTab === tab ? "active" : ""}`}
            onClick={() => setBottomTab(tab)}
          >
            {label(tab === "tools" ? "tools" : tab)}
          </button>
        ))}
      </div>
      <div className="bottom-content selectable">
        {bottomTab === "activity" && <ActivityContent />}
        {bottomTab === "logs" && <LogsContent />}
        {bottomTab === "tools" && <ToolEventsContent />}
      </div>
    </div>
  );
}

function ActivityContent() {
  return (
    <>
      {mockActivity.map((a) => (
        <div key={a.id} className="log-line">
          <span className="timestamp">{a.time}</span>
          <span style={{ color: "var(--app-text-secondary)" }}>{a.message}</span>
        </div>
      ))}
    </>
  );
}

function LogsContent() {
  return (
    <>
      {mockLogs.map((l, i) => (
        <div key={i} className="log-line">
          <span className="timestamp">{l.timestamp}</span>
          <span className={`level-${l.level}`}>[{l.level.toUpperCase()}]</span>{" "}
          <span>{l.message}</span>
        </div>
      ))}
    </>
  );
}

function ToolEventsContent() {
  return (
    <div style={{ padding: "var(--app-spacing-md)", color: "var(--app-text-muted)" }}>
      Tool events stream — placeholder
    </div>
  );
}

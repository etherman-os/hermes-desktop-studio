import { useThemeStore } from "../../stores/themeStore";
import { mockMessages, mockToolEvents } from "../../fixtures/mockData";
import { useRunStore } from "../../stores/runStore";

export function ChatSurface() {
  const label = useThemeStore((s) => s.label);
  const isStreaming = useRunStore((s) => s.isStreaming);

  return (
    <div className="chat-container">
      <div className="chat-messages selectable">
        {mockMessages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.role}`}>
            <div className="chat-message-role">{msg.role}</div>
            <div className="chat-message-content">{msg.content}</div>
            {msg.role === "assistant" && i === 1 && (
              <div style={{ display: "flex", gap: "var(--app-spacing-sm)", flexWrap: "wrap", marginTop: "var(--app-spacing-xs)" }}>
                {mockToolEvents.map((tool, j) => (
                  <span key={j} className={`tool-chip ${tool.status}`}>
                    {tool.status === "completed" ? "✓" : "⏳"} {tool.tool} ({tool.duration})
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="chat-message assistant">
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
      </div>
      <div className="composer-bar">
        <input className="composer-input" placeholder={`${label("composer")}...`} />
        <button className="composer-send">{label("send")}</button>
      </div>
    </div>
  );
}

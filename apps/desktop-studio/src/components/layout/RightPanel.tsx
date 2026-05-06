import { useThemeStore } from "../../stores/themeStore";
import { mockModel, mockMemory } from "../../fixtures/mockData";

export function RightPanel() {
  const label = useThemeStore((s) => s.label);
  const icon = useThemeStore((s) => s.icon);

  return (
    <div className="right-panel">
      <div className="right-section">
        <div className="right-section-title">{label("tools")} {icon("tools")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--app-spacing-xs)" }}>
          {["file_tree", "code_search", "bash", "edit"].map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: "var(--app-spacing-sm)", fontSize: "var(--app-font-size-sm)", color: "var(--app-text-secondary)" }}>
              <span style={{ color: "var(--app-ok)" }}>●</span> {t}
            </div>
          ))}
        </div>
      </div>
      <div className="right-section">
        <div className="right-section-title">{label("memory")} {icon("memory")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--app-spacing-xs)" }}>
          {mockMemory.map((m) => (
            <div key={m.key} style={{ fontSize: "var(--app-font-size-sm)" }}>
              <span style={{ color: "var(--app-text-muted)" }}>{m.key}:</span>{" "}
              <span style={{ color: "var(--app-text-secondary)" }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="right-section">
        <div className="right-section-title">{icon("inspector")} {label("inspector")}</div>
        <dl className="right-panel-info">
          <dt>Model</dt>
          <dd>{mockModel.name}</dd>
          <dt>Provider</dt>
          <dd>{mockModel.provider}</dd>
          <dt>Context</dt>
          <dd>{mockModel.contextWindow}</dd>
        </dl>
      </div>
    </div>
  );
}

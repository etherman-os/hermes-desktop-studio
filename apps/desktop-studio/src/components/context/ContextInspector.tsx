import React from "react";
import type { ContextSnapshot } from "../../api/studioClient";
import { useContextStore } from "../../stores/contextStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";

function shortValue(value: unknown, fallback = "unavailable") {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function profileName(snapshot: ContextSnapshot | null) {
  return shortValue(snapshot?.active_profile?.name ?? snapshot?.active_profile?.id, "unknown");
}

function modelLabel(snapshot: ContextSnapshot | null) {
  const provider = shortValue(snapshot?.model?.provider, "unknown");
  const model = shortValue(snapshot?.model?.model, "unknown");
  return `${provider} / ${model}`;
}

function backendMode(snapshot: ContextSnapshot | null) {
  const status = snapshot?.runtime?.backend_status;
  if (!status || typeof status !== "object") return "unknown";
  const record = status as Record<string, unknown>;
  return shortValue(record.active_backend ?? record.backend_mode, "unknown");
}

function fileLabel(path: string | null | undefined, name: string) {
  if (!path) return name;
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : name;
}

function RelatedCount({ label, count }: { label: string; count: number }) {
  return (
    <div className="context-pill">
      <span>{label}</span>
      <strong>{count}</strong>
    </div>
  );
}

export function ContextInspector() {
  const snapshot = useContextStore((s) => s.snapshot);
  const loading = useContextStore((s) => s.loading);
  const error = useContextStore((s) => s.error);
  const selectedScope = useContextStore((s) => s.selectedScope);
  const loadCurrentContext = useContextStore((s) => s.loadCurrentContext);
  const loadWorkspaceContext = useContextStore((s) => s.loadWorkspaceContext);
  const refresh = useContextStore((s) => s.refresh);
  const selectedWorkspace = useWorkspaceStore((s) => s.selectedWorkspace);
  const hasLoadedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    void loadCurrentContext(selectedWorkspace);
  }, [loadCurrentContext, selectedWorkspace]);

  const warningItems = snapshot
    ? Array.from(new Set([...snapshot.warnings, ...snapshot.context_files.warnings]))
    : [];

  return (
    <div className="context-inspector">
      <div className="surface-header">
        <div>
          <div className="workbench-eyebrow">Context Inspector</div>
          <h2>{selectedScope === "current" ? "Current influence map" : `${selectedScope} context`}</h2>
        </div>
        <div className="surface-actions">
          <button className="tool-button" onClick={() => void loadWorkspaceContext(selectedWorkspace)}>Workspace</button>
          <button className="tool-button" onClick={() => void refresh(selectedWorkspace)}>{loading ? "Refreshing" : "Refresh"}</button>
        </div>
      </div>

      {error && <div className="run-ledger-notice warning">Context unavailable: {error}</div>}
      {loading && !snapshot && <div className="workbench-empty compact">Loading context...</div>}

      {!snapshot && !loading && (
        <div className="workbench-empty compact">
          Select a workspace or run to inspect the profile, model, files, and linked Studio work that shaped the context.
        </div>
      )}

      {snapshot && (
        <div className="context-scroll selectable">
          <section className="context-section">
            <div className="context-section-title">Overview</div>
            <div className="context-grid">
              <div className="context-row"><span>Scope</span><span>{snapshot.scope}</span></div>
              <div className="context-row"><span>Profile</span><span>{profileName(snapshot)}</span></div>
              <div className="context-row"><span>Model/provider</span><span>{modelLabel(snapshot)}</span></div>
              <div className="context-row"><span>Backend</span><span>{backendMode(snapshot)}</span></div>
              <div className="context-row"><span>Workspace</span><span>{snapshot.workspace.name ?? "not selected"}</span></div>
              <div className="context-row"><span>Run</span><span>{snapshot.run?.id ?? "none"}</span></div>
              <div className="context-row"><span>Session</span><span>{shortValue(snapshot.session?.id, "none")}</span></div>
            </div>
          </section>

          <section className="context-section">
            <div className="context-section-title">Context Files</div>
            <div className="context-file-list">
              {snapshot.context_files.items.map((item) => (
                <div key={item.name} className={`context-file ${item.available ? "available" : ""}`}>
                  <div className="context-file-header">
                    <span>{fileLabel(item.path, item.name)}</span>
                    <strong>{item.available ? "available" : "missing"}</strong>
                  </div>
                  {item.preview && <pre>{item.preview}</pre>}
                  {item.warning && <div className="inline-warning">{item.warning}</div>}
                  {item.redacted && <div className="inline-warning">Preview redacted</div>}
                </div>
              ))}
            </div>
          </section>

          <section className="context-section">
            <div className="context-section-title">Memory</div>
            <div className="panel-note">
              {snapshot.memory.available ? `${snapshot.memory.items.length} snippets available` : snapshot.memory.warnings.join(" ")}
            </div>
          </section>

          <section className="context-section">
            <div className="context-section-title">Skills</div>
            <div className="panel-note">
              {snapshot.skills.available ? `${snapshot.skills.items.length} skills available` : snapshot.skills.warnings.join(" ")}
            </div>
          </section>

          <section className="context-section">
            <div className="context-section-title">Related Work</div>
            <div className="context-related">
              <RelatedCount label="Runs" count={snapshot.related.runs.length} />
              <RelatedCount label="Sessions" count={snapshot.related.sessions.length} />
              <RelatedCount label="Cards" count={snapshot.related.kanban_cards.length} />
              <RelatedCount label="Artifacts" count={snapshot.related.artifacts.length} />
            </div>
            <div className="context-link-list">
              {snapshot.related.artifacts.slice(0, 4).map((artifact) => (
                <div key={artifact.id} className="context-link-row">
                  <span>{artifact.title}</span>
                  <span>{artifact.type}</span>
                </div>
              ))}
              {snapshot.related.kanban_cards.slice(0, 4).map((card) => (
                <div key={card.id} className="context-link-row">
                  <span>{card.title}</span>
                  <span>{card.status}</span>
                </div>
              ))}
            </div>
          </section>

          {warningItems.length > 0 && (
            <section className="context-section">
              <div className="context-section-title">Warnings</div>
              {warningItems.map((warning) => (
                <div key={warning} className="inline-warning">{warning}</div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
import type { ArtifactDetail, ArtifactType } from "../../api/studioClient";
import { useArtifactStore } from "../../stores/artifactStore";
import { useContextStore } from "../../stores/contextStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { useThemeStore } from "../../stores/themeStore";

const ARTIFACT_TYPES: Array<{ id: "all" | ArtifactType; label: string }> = [
  { id: "all", label: "All" },
  { id: "markdown", label: "Markdown" },
  { id: "text", label: "Text" },
  { id: "log_snapshot", label: "Logs" },
  { id: "test_result", label: "Tests" },
  { id: "report", label: "Reports" },
  { id: "html", label: "HTML" },
  { id: "screenshot", label: "Screenshots" },
  { id: "file_reference", label: "Files" },
  { id: "json", label: "JSON" },
  { id: "unknown", label: "Unknown" },
];

const CREATE_TYPES: ArtifactType[] = ["markdown", "text", "log_snapshot", "test_result", "report", "html", "file_reference", "json"];

interface EditorState {
  title: string;
  type: ArtifactType;
  description: string;
  contentText: string;
  filePath: string;
  mimeType: string;
  runId: string;
  sessionId: string;
  cardId: string;
}

interface ArtifactEditorProps {
  saving: boolean;
  onCancel: () => void;
  onSubmit: (state: EditorState) => Promise<void>;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function sourceLabel(artifact: ArtifactDetail) {
  if (artifact.run_id) return "run";
  if (artifact.session_id) return "session";
  if (artifact.kanban_card_id) return "card";
  return artifact.source || "manual";
}

function typeLabel(type: string) {
  if (type === "log_snapshot") return "log";
  if (type === "test_result") return "test";
  if (type === "file_reference") return "file";
  return type;
}

function contentForJson(content: string) {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

function markdownBlocks(content: string) {
  return content.split(/\n{2,}/).map((block, index) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("# ")) {
      return <h3 key={index}>{trimmed.slice(2)}</h3>;
    }
    if (trimmed.startsWith("## ")) {
      return <h4 key={index}>{trimmed.slice(3)}</h4>;
    }
    if (trimmed.includes("\n- ")) {
      return (
        <ul key={index}>
          {trimmed.split("\n").map((line) => <li key={line}>{line.replace(/^- /, "")}</li>)}
        </ul>
      );
    }
    return <p key={index}>{trimmed}</p>;
  });
}

function ArtifactEditor({ saving, onCancel, onSubmit }: ArtifactEditorProps) {
  const [state, setState] = React.useState<EditorState>({
    title: "",
    type: "markdown",
    description: "",
    contentText: "",
    filePath: "",
    mimeType: "",
    runId: "",
    sessionId: "",
    cardId: "",
  });
  const [validation, setValidation] = React.useState<string | null>(null);

  function update<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setState((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!state.title.trim()) {
      setValidation("Title is required");
      return;
    }
    if (state.type === "file_reference" && !state.filePath.trim()) {
      setValidation("File reference artifacts need a path");
      return;
    }
    setValidation(null);
    await onSubmit({
      ...state,
      title: state.title.trim(),
      description: state.description.trim(),
      contentText: state.contentText,
      filePath: state.filePath.trim(),
      mimeType: state.mimeType.trim(),
      runId: state.runId.trim(),
      sessionId: state.sessionId.trim(),
      cardId: state.cardId.trim(),
    });
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <form className="studio-modal artifact-modal" onSubmit={(event) => void submit(event)}>
        <div className="modal-header">
          <div>
            <div className="workbench-eyebrow">Artifact</div>
            <h2>Create Artifact</h2>
          </div>
          <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">x</button>
        </div>
        <div className="modal-body artifact-editor-grid">
          <div className="new-run-main">
            <label className="field-label" htmlFor="artifact-title">Title</label>
            <input
              id="artifact-title"
              className="studio-input"
              value={state.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="Run report, log excerpt, test result, or file reference"
              autoFocus
            />

            <label className="field-label" htmlFor="artifact-description">Description</label>
            <input
              id="artifact-description"
              className="studio-input"
              value={state.description}
              onChange={(event) => update("description", event.target.value)}
              placeholder="Optional short context"
            />

            <label className="field-label" htmlFor="artifact-content">Content</label>
            <textarea
              id="artifact-content"
              className="studio-textarea artifact-editor-content"
              value={state.contentText}
              disabled={state.type === "file_reference"}
              onChange={(event) => update("contentText", event.target.value)}
              placeholder={state.type === "file_reference" ? "File references store path metadata only" : "Paste markdown, logs, text, JSON, or report content"}
            />
          </div>
          <div className="new-run-side">
            <label className="field-label" htmlFor="artifact-type">Type</label>
            <select
              id="artifact-type"
              className="studio-select"
              value={state.type}
              onChange={(event) => update("type", event.target.value as ArtifactType)}
            >
              {CREATE_TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}
            </select>

            <label className="field-label" htmlFor="artifact-file">File path</label>
            <input
              id="artifact-file"
              className="studio-input"
              value={state.filePath}
              onChange={(event) => update("filePath", event.target.value)}
              placeholder="Optional local path"
            />

            <label className="field-label" htmlFor="artifact-mime">MIME type</label>
            <input
              id="artifact-mime"
              className="studio-input"
              value={state.mimeType}
              onChange={(event) => update("mimeType", event.target.value)}
              placeholder="text/markdown"
            />

            <label className="field-label" htmlFor="artifact-run">Linked run ID</label>
            <input id="artifact-run" className="studio-input" value={state.runId} onChange={(event) => update("runId", event.target.value)} placeholder="Optional" />

            <label className="field-label" htmlFor="artifact-session">Linked session ID</label>
            <input id="artifact-session" className="studio-input" value={state.sessionId} onChange={(event) => update("sessionId", event.target.value)} placeholder="Optional" />

            <label className="field-label" htmlFor="artifact-card">Linked card ID</label>
            <input id="artifact-card" className="studio-input" value={state.cardId} onChange={(event) => update("cardId", event.target.value)} placeholder="Optional" />

            {validation && <div className="inline-warning">{validation}</div>}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="tool-button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="primary-button" disabled={saving || !state.title.trim()}>
            {saving ? "Saving" : "Create Artifact"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ArtifactViewer({ artifact }: { artifact: ArtifactDetail | null }) {
  if (!artifact) {
    return <div className="workbench-empty compact">Select an artifact to inspect metadata and content.</div>;
  }

  const content = artifact.content_text ?? "";
  return (
    <div className="artifact-detail selectable">
      <div className="artifact-detail-header">
        <div>
          <div className="workbench-eyebrow">{typeLabel(artifact.type)} artifact</div>
          <h3>{artifact.title}</h3>
        </div>
        <span className={`artifact-type-badge artifact-type-${artifact.type}`}>{typeLabel(artifact.type)}</span>
      </div>

      <dl className="artifact-meta">
        <div><dt>Source</dt><dd>{sourceLabel(artifact)}</dd></div>
        <div><dt>Created</dt><dd>{formatDate(artifact.created_at)}</dd></div>
        <div><dt>Updated</dt><dd>{formatDate(artifact.updated_at)}</dd></div>
        {artifact.run_id && <div><dt>Run</dt><dd>{artifact.run_id}</dd></div>}
        {artifact.session_id && <div><dt>Session</dt><dd>{artifact.session_id}</dd></div>}
        {artifact.kanban_card_id && <div><dt>Card</dt><dd>{artifact.kanban_card_id}</dd></div>}
        {artifact.file_name && <div><dt>File</dt><dd>{artifact.file_name}</dd></div>}
        {artifact.mime_type && <div><dt>MIME</dt><dd>{artifact.mime_type}</dd></div>}
      </dl>

      {artifact.description && <div className="artifact-description">{artifact.description}</div>}

      {artifact.type === "file_reference" && (
        <div className="artifact-file-reference">
          <div className="artifact-file-name">{artifact.file_name ?? "Local file reference"}</div>
          <div className="artifact-file-path">{artifact.file_path ?? "Path unavailable"}</div>
          <button className="tool-button" disabled>Open file placeholder</button>
        </div>
      )}

      {artifact.type === "html" && (
        <div className="inline-warning">HTML preview is disabled in v1. Source is shown as inert text.</div>
      )}

      {content && artifact.type === "markdown" && (
        <div className="artifact-markdown">{markdownBlocks(content)}</div>
      )}
      {content && artifact.type === "json" && (
        <pre className="artifact-code">{contentForJson(content)}</pre>
      )}
      {content && (artifact.type === "text" || artifact.type === "log_snapshot" || artifact.type === "test_result" || artifact.type === "report" || artifact.type === "html" || artifact.type === "unknown") && (
        <pre className="artifact-code">{content}</pre>
      )}
      {!content && artifact.type !== "file_reference" && (
        <div className="workbench-empty compact">This artifact has metadata only.</div>
      )}
    </div>
  );
}

export function ArtifactShelf() {
  const artifacts = useArtifactStore((s) => s.artifacts);
  const selectedArtifact = useArtifactStore((s) => s.selectedArtifact);
  const selectedArtifactId = useArtifactStore((s) => s.selectedArtifactId);
  const loading = useArtifactStore((s) => s.loading);
  const saving = useArtifactStore((s) => s.saving);
  const error = useArtifactStore((s) => s.error);
  const actionMessage = useArtifactStore((s) => s.actionMessage);
  const filterType = useArtifactStore((s) => s.filterType);
  const search = useArtifactStore((s) => s.search);
  const loadArtifacts = useArtifactStore((s) => s.loadArtifacts);
  const selectArtifact = useArtifactStore((s) => s.selectArtifact);
  const createArtifact = useArtifactStore((s) => s.createArtifact);
  const archiveArtifact = useArtifactStore((s) => s.archiveArtifact);
  const setFilterType = useArtifactStore((s) => s.setFilterType);
  const setSearch = useArtifactStore((s) => s.setSearch);
  const loadRunContext = useContextStore((s) => s.loadRunContext);
  const loadSessionContext = useContextStore((s) => s.loadSessionContext);
  const setSidebarSection = useLayoutStore((s) => s.setSidebarSection);
  const showSidebar = useLayoutStore((s) => s.showSidebar);
  const label = useThemeStore((s) => s.label);
  const icon = useThemeStore((s) => s.icon);
  const [editorOpen, setEditorOpen] = React.useState(false);

  React.useEffect(() => {
    void loadArtifacts();
  }, [loadArtifacts]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => void loadArtifacts(), 200);
    return () => window.clearTimeout(handle);
  }, [filterType, search, loadArtifacts]);

  async function submitArtifact(state: EditorState) {
    const artifact = await createArtifact({
      title: state.title,
      type: state.type,
      description: state.description || null,
      content_text: state.type === "file_reference" ? null : state.contentText,
      file_path: state.filePath || null,
      mime_type: state.mimeType || null,
      run_id: state.runId || null,
      session_id: state.sessionId || null,
      kanban_card_id: state.cardId || null,
      source: "manual",
    });
    if (artifact) setEditorOpen(false);
  }

  async function inspectArtifactContext(artifact: ArtifactDetail) {
    setSidebarSection("context");
    showSidebar();
    if (artifact.run_id) {
      await loadRunContext(artifact.run_id);
      return;
    }
    if (artifact.session_id) {
      await loadSessionContext(artifact.session_id);
    }
  }

  return (
    <div className="artifact-shelf">
      <div className="surface-header">
        <div>
          <div className="workbench-eyebrow">{icon("artifacts")} {label("artifacts")}</div>
          <h2>Persistent run and workflow outputs</h2>
        </div>
        <div className="surface-actions">
          <span className="surface-badge">Studio-owned studio.db</span>
          <button className="tool-button" onClick={() => void loadArtifacts()}>{loading ? "Refreshing" : "Refresh"}</button>
          <button className="primary-button" onClick={() => setEditorOpen(true)}>Create Artifact</button>
        </div>
      </div>

      <div className="artifact-toolbar">
        <input
          className="studio-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search artifact titles and descriptions"
        />
        <select className="studio-select" value={filterType} onChange={(event) => setFilterType(event.target.value)}>
          {ARTIFACT_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
        </select>
      </div>

      {(error || actionMessage) && (
        <div className={`run-ledger-notice ${error ? "warning" : ""}`}>
          {error ? `Artifacts unavailable: ${error}` : actionMessage}
        </div>
      )}

      {loading && artifacts.length === 0 && <div className="workbench-empty compact">Loading artifacts...</div>}

      {!loading && artifacts.length === 0 && !error && (
        <div className="workbench-empty compact">
          No artifacts captured yet. Create one manually, or preserve run/session summaries from the workbench.
        </div>
      )}

      <div className="artifact-workspace">
        <div className="artifact-list selectable">
          {artifacts.map((artifact) => (
            <button
              key={artifact.id}
              className={`artifact-row ${selectedArtifactId === artifact.id ? "active" : ""}`}
              onClick={() => void selectArtifact(artifact.id)}
            >
              <span className="artifact-row-title">{artifact.title}</span>
              <span className="artifact-row-meta">
                <span className={`artifact-type-badge artifact-type-${artifact.type}`}>{typeLabel(artifact.type)}</span>
                <span>{sourceLabel(artifact)}</span>
                <span>{formatDate(artifact.updated_at)}</span>
              </span>
              {(artifact.run_id || artifact.session_id || artifact.kanban_card_id) && (
                <span className="artifact-row-links">
                  {artifact.run_id && <span>Run</span>}
                  {artifact.session_id && <span>Session</span>}
                  {artifact.kanban_card_id && <span>Card</span>}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="artifact-detail-pane">
          <div className="artifact-detail-actions">
            {selectedArtifact && (selectedArtifact.run_id || selectedArtifact.session_id) && (
              <button className="tool-button" onClick={() => void inspectArtifactContext(selectedArtifact)}>Inspect Context</button>
            )}
            {selectedArtifact && <button className="tool-button danger" disabled={saving} onClick={() => void archiveArtifact(selectedArtifact.id)}>Archive</button>}
          </div>
          <ArtifactViewer artifact={selectedArtifact} />
        </div>
      </div>

      {editorOpen && (
        <ArtifactEditor
          saving={saving}
          onCancel={() => setEditorOpen(false)}
          onSubmit={submitArtifact}
        />
      )}
    </div>
  );
}

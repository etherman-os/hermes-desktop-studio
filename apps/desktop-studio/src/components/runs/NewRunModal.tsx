import React from "react";
import { useUiStore } from "../../stores/uiStore";
import { useWorkspaceStore } from "../../stores/workspaceStore";
import { useRunStore } from "../../stores/runStore";
import { useSessionStore } from "../../stores/sessionStore";
import { useProfileStore } from "../../stores/profileStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { useModelStore } from "../../stores/modelStore";
import { useHermesInventoryStore } from "../../stores/hermesInventoryStore";
import { RUN_PRESETS, presetDraft } from "../../lib/runPresets";

export function NewRunModal() {
  const open = useUiStore((s) => s.newRunOpen);
  const draft = useUiStore((s) => s.newRunDraft);
  const close = useUiStore((s) => s.closeNewRun);
  const openWorkspacePicker = useUiStore((s) => s.openWorkspacePicker);
  const selectedWorkspace = useWorkspaceStore((s) => s.selectedWorkspace);
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace);
  const sendPrompt = useRunStore((s) => s.sendPrompt);
  const newChat = useRunStore((s) => s.newChat);
  const isStreaming = useRunStore((s) => s.isStreaming);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const config = useModelStore((s) => s.config);
  const availableModels = useModelStore((s) => s.availableModels);
  const loadConfig = useModelStore((s) => s.loadConfig);
  const skills = useHermesInventoryStore((s) => s.skills);
  const toolsets = useHermesInventoryStore((s) => s.toolsets);
  const loadInventory = useHermesInventoryStore((s) => s.loadInventory);
  const [prompt, setPrompt] = React.useState("");
  const [workspacePath, setWorkspacePath] = React.useState(selectedWorkspace ?? "");
  const [sessionId, setSessionId] = React.useState(activeSessionId ?? "default");
  const [mode, setMode] = React.useState("chat");
  const [linkedCard, setLinkedCard] = React.useState("");
  const [selectedModel, setSelectedModel] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState("");
  const [selectedSkills, setSelectedSkills] = React.useState<string[]>([]);
  const [selectedToolsets, setSelectedToolsets] = React.useState<string[]>([]);
  const [checkpoints, setCheckpoints] = React.useState(true);
  const [maxTurns, setMaxTurns] = React.useState(90);
  const [worktree, setWorktree] = React.useState(false);
  const [passSessionId, setPassSessionId] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setWorkspacePath(selectedWorkspace ?? "");
    setSessionId(activeSessionId ?? "default");
    setPrompt(draft?.prompt ?? "");
    setMode(draft?.mode ?? "chat");
    setLinkedCard(draft?.linkedCard ?? "");
    setSelectedSkills(draft?.skills ?? []);
    setSelectedToolsets(draft?.toolsets ?? []);
    setCheckpoints(draft?.checkpoints ?? true);
    setMaxTurns(draft?.maxTurns ?? 90);
    setWorktree(draft?.worktree ?? false);
    setPassSessionId(draft?.passSessionId ?? false);
    loadConfig();
    loadInventory();
  }, [open, selectedWorkspace, activeSessionId, draft, loadConfig, loadInventory]);

  React.useEffect(() => {
    if (!open || !config) return;
    setSelectedModel(config.model);
    setSelectedProvider(config.provider);
  }, [open, config]);

  React.useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  if (!open) return null;

  async function submit() {
    const text = prompt.trim();
    if (!text) return;
    const workspace = workspacePath.trim() || null;
    if (workspace) selectWorkspace(workspace);
    newChat();
    close();
    setActiveTab("chat");
    setPrompt("");
    await sendPrompt(text, sessionId || "default", {
      workspacePath: workspace,
      mode,
      model: selectedModel || undefined,
      provider: selectedProvider || undefined,
      skills: selectedSkills.length ? selectedSkills : undefined,
      toolsets: selectedToolsets.length ? selectedToolsets : undefined,
      checkpoints,
      maxTurns,
      worktree,
      passSessionId,
      linkedCardId: linkedCard.trim() || null,
    });
  }

  const providers = [...new Set(availableModels.map((m) => m.provider))];
  const modelsForProvider = selectedProvider
    ? availableModels.filter((m) => m.provider === selectedProvider)
    : availableModels;
  const installedSkills = skills.filter((skill) => skill.installed);
  const visibleSkills = [
    ...installedSkills.filter((skill) => selectedSkills.includes(skill.cli_name || skill.name || skill.id)),
    ...installedSkills.filter((skill) => !selectedSkills.includes(skill.cli_name || skill.name || skill.id)),
  ].slice(0, 24);
  const runToolsetsAll = toolsets.filter((toolset) => toolset.platform === "cli" || toolset.kind === "mcp");
  const runToolsets = [
    ...runToolsetsAll.filter((toolset) => selectedToolsets.includes(toolset.id)),
    ...runToolsetsAll.filter((toolset) => !selectedToolsets.includes(toolset.id)),
  ].slice(0, 28);

  function toggleSkill(skillId: string) {
    setSelectedSkills((current) => current.includes(skillId)
      ? current.filter((item) => item !== skillId)
      : [...current, skillId]);
  }

  function toggleToolset(toolsetId: string) {
    setSelectedToolsets((current) => current.includes(toolsetId)
      ? current.filter((item) => item !== toolsetId)
      : [...current, toolsetId]);
  }

  return (
    <div className="modal-backdrop" onClick={close} role="dialog" aria-modal="true" aria-label="New run">
      <div className="studio-modal new-run-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="workbench-eyebrow">New Run</div>
            <h2 id="new-run-title">Start Hermes work in a local workspace</h2>
          </div>
          <button className="icon-button" onClick={close} title="Close" aria-label="Close dialog">x</button>
        </div>

        <div className="modal-body new-run-grid">
          <div className="new-run-main">
            <label className="field-label" htmlFor="new-run-prompt">Prompt</label>
            <div className="run-preset-grid" aria-label="Hermes run presets">
              {RUN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`run-preset ${mode === preset.mode ? "active" : ""}`}
                  onClick={() => {
                    const next = presetDraft(preset);
                    setPrompt(next.prompt ?? "");
                    setMode(next.mode ?? "chat");
                    setSelectedSkills(next.skills ?? []);
                    setSelectedToolsets(next.toolsets ?? []);
                    setCheckpoints(next.checkpoints ?? true);
                    setMaxTurns(next.maxTurns ?? 90);
                    setWorktree(next.worktree ?? false);
                    setPassSessionId(next.passSessionId ?? false);
                  }}
                  title={preset.description}
                >
                  <span>{preset.label}</span>
                  <small>{preset.description}</small>
                </button>
              ))}
            </div>
            <textarea
              id="new-run-prompt"
              className="studio-textarea"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask Hermes to inspect, debug, review, or implement something..."
              autoFocus
            />
          </div>

          <div className="new-run-side">
            <label className="field-label" htmlFor="new-run-workspace">Workspace path</label>
            <div className="inline-field">
              <input
                id="new-run-workspace"
                className="studio-input"
                value={workspacePath}
                onChange={(event) => setWorkspacePath(event.target.value)}
                placeholder="/home/user/project"
              />
              <button className="tool-button" onClick={openWorkspacePicker}>Select</button>
            </div>
            <div className="field-help">Forwarded to Hermes as run context and stored in the Studio ledger.</div>

            <label className="field-label" htmlFor="new-run-mode">Run mode</label>
            <select id="new-run-mode" className="studio-select" value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="chat">Chat</option>
              <option value="task">Task</option>
              <option value="review">Review</option>
              <option value="debug">Debug</option>
              <option value="design">Design</option>
              <option value="verify">Verify</option>
              <option value="orchestration">Orchestration</option>
              <option value="video">Video</option>
              <option value="memory">Memory</option>
            </select>

            <label className="field-label" htmlFor="new-run-session">Session</label>
            <select id="new-run-session" className="studio-select" value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
              <option value="default">Default session</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>{session.title}</option>
              ))}
            </select>

            <label className="field-label">Profile</label>
            <div className="readonly-field">{activeProfile?.name ?? "unknown"}</div>

            <label className="field-label" htmlFor="new-run-provider">Provider</label>
            <select
              id="new-run-provider"
              className="studio-select"
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                const firstModel = availableModels.find((m) => m.provider === e.target.value);
                setSelectedModel(firstModel?.id ?? "");
              }}
            >
              <option value="">{config?.provider ?? "Select provider"}</option>
              {providers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <label className="field-label" htmlFor="new-run-model">Model</label>
            <select
              id="new-run-model"
              className="studio-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="">{config?.model ?? "Select model"}</option>
              {modelsForProvider.map((m) => (
                <option key={`${m.provider}:${m.id}`} value={m.id}>{m.name || m.id}</option>
              ))}
            </select>
            <div className="field-help">
              {availableModels.length.toLocaleString()} local Hermes model{availableModels.length !== 1 ? "s" : ""} detected.
            </div>

            {installedSkills.length > 0 && (
              <>
                <label className="field-label">Preload skills</label>
                <div className="selector-chip-grid">
                  {visibleSkills.map((skill) => {
                    const cliName = skill.cli_name || skill.name || skill.id;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        className={`selector-chip ${selectedSkills.includes(cliName) ? "active" : ""}`}
                        onClick={() => toggleSkill(cliName)}
                        title={skill.description || skill.title}
                      >
                        {skill.name}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {runToolsets.length > 0 && (
              <>
                <label className="field-label">Toolsets</label>
                <div className="selector-chip-grid">
                  {runToolsets.map((toolset) => (
                    <button
                      key={`${toolset.platform}:${toolset.id}`}
                      type="button"
                      className={`selector-chip ${selectedToolsets.includes(toolset.id) ? "active" : ""}`}
                      onClick={() => toggleToolset(toolset.id)}
                    >
                      {toolset.id}
                    </button>
                  ))}
                </div>
              </>
            )}

            <label className="field-label">Hermes execution</label>
            <div className="run-option-grid">
              <label className="run-option">
                <input type="checkbox" checked={checkpoints} onChange={(event) => setCheckpoints(event.target.checked)} />
                <span>Checkpoints</span>
              </label>
              <label className="run-option">
                <input type="checkbox" checked={worktree} onChange={(event) => setWorktree(event.target.checked)} />
                <span>Worktree</span>
              </label>
              <label className="run-option">
                <input type="checkbox" checked={passSessionId} onChange={(event) => setPassSessionId(event.target.checked)} />
                <span>Session ID</span>
              </label>
              <label className="run-option number">
                <span>Max turns</span>
                <input
                  className="studio-input"
                  type="number"
                  min={1}
                  max={300}
                  value={maxTurns}
                  onChange={(event) => setMaxTurns(Number(event.target.value) || 90)}
                />
              </label>
            </div>

            <label className="field-label" htmlFor="new-run-card">Linked Kanban card</label>
            <input
              id="new-run-card"
              className="studio-input"
              value={linkedCard}
              onChange={(event) => setLinkedCard(event.target.value)}
              placeholder="Optional card id"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="tool-button" onClick={close}>Cancel</button>
          <button className="primary-button" onClick={() => void submit()} disabled={!prompt.trim() || isStreaming}>
            {isStreaming ? "Run in progress" : "Start Run"}
          </button>
        </div>
      </div>
    </div>
  );
}

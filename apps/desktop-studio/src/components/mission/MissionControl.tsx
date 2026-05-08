import React from "react";
import { useAdapterStore } from "../../stores/adapterStore";
import { useApprovalStore } from "../../stores/approvalStore";
import { useDelegationStore } from "../../stores/delegationStore";
import { useHermesInventoryStore } from "../../stores/hermesInventoryStore";
import { useLayoutStore } from "../../stores/layoutStore";
import { useModelStore } from "../../stores/modelStore";
import { useProcessStore } from "../../stores/processStore";
import { useRunLedgerStore } from "../../stores/runLedgerStore";
import { useUiStore } from "../../stores/uiStore";
import { RUN_PRESETS, presetDraft } from "../../lib/runPresets";

export function MissionControl() {
  const connected = useAdapterStore((s) => s.connected);
  const backendMode = useAdapterStore((s) => s.backendMode);
  const activeBackend = useAdapterStore((s) => s.activeBackend);
  const hermesConnected = useAdapterStore((s) => s.hermesConnected);
  const fallbackReason = useAdapterStore((s) => s.fallbackReason);
  const runs = useRunLedgerStore((s) => s.runs);
  const loadRuns = useRunLedgerStore((s) => s.loadRecentRuns);
  const processes = useProcessStore((s) => s.processes);
  const templates = useProcessStore((s) => s.templates);
  const loadProcesses = useProcessStore((s) => s.loadProcesses);
  const startProcess = useProcessStore((s) => s.startProcess);
  const pendingApprovals = useApprovalStore((s) => s.pending);
  const loadApprovals = useApprovalStore((s) => s.loadPendingApprovals);
  const delegations = useDelegationStore((s) => s.delegations);
  const loadDelegations = useDelegationStore((s) => s.loadDelegations);
  const inventorySummary = useHermesInventoryStore((s) => s.summary);
  const toolsets = useHermesInventoryStore((s) => s.toolsets);
  const cliStatus = useHermesInventoryStore((s) => s.cliStatus);
  const checkpointStore = useHermesInventoryStore((s) => s.checkpointStore);
  const loadInventory = useHermesInventoryStore((s) => s.loadInventory);
  const loadLocalHermesStatus = useHermesInventoryStore((s) => s.loadLocalHermesStatus);
  const config = useModelStore((s) => s.config);
  const loadConfig = useModelStore((s) => s.loadConfig);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const openNewRun = useUiStore((s) => s.openNewRun);

  React.useEffect(() => {
    if (!connected) return;
    void loadRuns();
    void loadProcesses();
    void loadApprovals();
    void loadDelegations();
    void loadInventory();
    void loadLocalHermesStatus();
    void loadConfig();
    const timer = window.setInterval(() => {
      void loadRuns();
      void loadProcesses();
      void loadApprovals();
      void loadDelegations();
    }, 6000);
    return () => window.clearInterval(timer);
  }, [connected, loadApprovals, loadConfig, loadDelegations, loadInventory, loadLocalHermesStatus, loadProcesses, loadRuns]);

  const runningRuns = runs.filter((run) => run.status === "running" || run.status === "starting" || run.status === "queued").length;
  const activeProcesses = processes.filter((process) => process.status === "running" || process.status === "starting");
  const gatewayRunning = activeProcesses.some((process) => process.template_id === "hermes-gateway");
  const hasGatewayTemplate = templates.some((template) => template.id === "hermes-gateway");
  const activeBackendLabel = backendMode === "auto" ? activeBackend : backendMode;

  function refreshAll() {
    void loadRuns();
    void loadProcesses();
    void loadApprovals();
    void loadDelegations();
    void loadInventory();
    void loadLocalHermesStatus();
    void loadConfig();
  }

  return (
    <div className="mission-control">
      <div className="mission-hero">
        <div>
          <div className="workbench-eyebrow">Mission Control</div>
          <h2>Hermes local runtime command center</h2>
          <div className="mission-subtitle">
            {config ? `${config.provider} / ${config.model}` : "Model loading"} · {inventorySummary ? `${inventorySummary.installed_skill_count} skills · ${inventorySummary.mcp_server_count} MCP` : "inventory loading"}
          </div>
        </div>
        <div className="mission-actions">
          <button className="tool-button" onClick={refreshAll}>Refresh</button>
          <button className="primary-button" onClick={() => openNewRun()}>
            New Local Run
          </button>
          <button
            className="tool-button"
            disabled={!hasGatewayTemplate || gatewayRunning}
            onClick={() => void startProcess("hermes-gateway")}
          >
            {gatewayRunning ? "Bridge Running" : "Gateway Bridge"}
          </button>
        </div>
      </div>

      {fallbackReason && (
        <div className="inline-warning">
          Auto mode fallback: {fallbackReason}
        </div>
      )}

      <div className="mission-preset-grid" aria-label="Local Hermes run presets">
        {RUN_PRESETS.map((preset) => (
          <button
            key={preset.id}
            className="mission-preset"
            onClick={() => openNewRun(presetDraft(preset))}
            title={preset.description}
          >
            <span>{preset.label}</span>
            <small>{preset.toolsets.slice(0, 4).join(" · ")}</small>
          </button>
        ))}
      </div>

      <div className="mission-grid">
        <button className="mission-card" onClick={() => setActiveTab("runs")}>
          <span className="mission-card-label">Runs</span>
          <strong>{runningRuns}</strong>
          <span>{runs.length} recent ledger records</span>
        </button>
        <button className="mission-card" onClick={() => setActiveTab("approvals")}>
          <span className="mission-card-label">Approvals</span>
          <strong>{pendingApprovals.length}</strong>
          <span>waiting for a decision</span>
        </button>
        <button className="mission-card" onClick={() => setActiveTab("processes")}>
          <span className="mission-card-label">Processes</span>
          <strong>{activeProcesses.length}</strong>
          <span>{gatewayRunning ? "Hermes gateway is managed here" : "gateway can be started here"}</span>
        </button>
        <button className="mission-card" onClick={() => setActiveTab("extensions")}>
          <span className="mission-card-label">Hermes Arsenal</span>
          <strong>{inventorySummary?.toolset_count ?? 0}</strong>
          <span>{inventorySummary?.provider_count ?? 0} providers · {inventorySummary?.model_count ?? 0} models</span>
        </button>
      </div>

      <div className="mission-panels">
        <section className="mission-panel">
          <div className="inventory-section-title">Runtime</div>
          <dl className="right-panel-info">
            <dt>Adapter</dt>
            <dd>{connected ? "Connected" : "Disconnected"}</dd>
            <dt>Backend</dt>
            <dd>{activeBackendLabel === "mock" ? "Studio simulation" : activeBackendLabel}</dd>
            <dt>Hermes CLI</dt>
            <dd>{cliStatus?.version ?? (cliStatus?.available === false ? "Unavailable" : "Loading")}</dd>
            <dt>Hermes Gateway</dt>
            <dd>{hermesConnected ? "Reachable" : gatewayRunning ? "Starting bridge" : "Not required for local CLI"}</dd>
            <dt>Provider</dt>
            <dd>{config?.provider ?? "unknown"}</dd>
            <dt>Model</dt>
            <dd>{config?.model ?? "unknown"}</dd>
            <dt>Checkpoints</dt>
            <dd>{checkpointStore?.status?.total_size ?? (checkpointStore?.available ? "Available" : "Unknown")}</dd>
          </dl>
        </section>

        <section className="mission-panel">
          <div className="inventory-section-title">Active Work</div>
          <div className="mission-list">
            {runs.slice(0, 6).map((run) => (
              <button key={run.runId} className="mission-list-row" onClick={() => setActiveTab("runs")}>
                <span>{run.prompt || run.runId}</span>
                <small>{run.status}</small>
              </button>
            ))}
            {runs.length === 0 && <div className="panel-note">No run activity yet</div>}
          </div>
        </section>

        <section className="mission-panel">
          <div className="inventory-section-title">Local Agents</div>
          <div className="mission-list">
            {delegations.slice(0, 6).map((delegation) => (
              <button key={delegation.id} className="mission-list-row" onClick={() => setActiveTab("delegations")}>
                <span>{delegation.tool_name || delegation.child_run_id}</span>
                <small>{delegation.status}</small>
              </button>
            ))}
            {delegations.length === 0 && <div className="panel-note">No delegations recorded</div>}
          </div>
        </section>

        <section className="mission-panel">
          <div className="inventory-section-title">Hermes Capabilities</div>
          <div className="mission-chip-cloud">
            {toolsets.slice(0, 12).map((toolset) => (
              <span key={toolset.id} className={`inventory-pill ${toolset.enabled ? "installed" : ""}`}>{toolset.id}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

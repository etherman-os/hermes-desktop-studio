import React from "react";
import type { StudioEvent } from "../../api/studioClient";
import { useLayoutStore } from "../../stores/layoutStore";
import { useRunLedgerStore, type RunRecord } from "../../stores/runLedgerStore";
import { useSessionStore } from "../../stores/sessionStore";

interface TimelineEntry {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  summary: string;
  tone: "normal" | "warning" | "error" | "success";
  events: StudioEvent[];
}

function summarizeEvent(event: StudioEvent) {
  const payload = event.payload;
  switch (event.type) {
    case "run.started":
      return `Run ${payload.run_id ?? event.run_id ?? ""} started`;
    case "assistant.delta":
      return typeof payload.text === "string" ? payload.text : "Assistant stream";
    case "assistant.completed":
      return `Assistant completed${payload.model ? ` with ${payload.model}` : ""}`;
    case "tool.started":
      return `Tool started: ${payload.tool ?? "unknown"}`;
    case "tool.progress":
      return `${payload.tool ?? "Tool"} progress${payload.message ? `: ${payload.message}` : ""}`;
    case "tool.completed":
      return `Tool completed: ${payload.tool ?? "unknown"}${payload.success === false ? " failed" : ""}`;
    case "approval.requested":
      return `Approval requested: ${payload.tool ?? "tool"} ${payload.action ?? ""}`;
    case "approval.resolved":
      return `Approval ${payload.decision ?? "resolved"}`;
    case "memory.updated":
      return `Memory ${payload.action ?? "updated"}`;
    case "kanban.updated":
      return `Board ${payload.action ?? "updated"}`;
    case "run.completed":
      return "Run completed";
    case "run.failed":
      return typeof payload.message === "string" ? payload.message : "Run failed";
    case "run.cancelled":
      return "Run cancelled";
    case "adapter.warning":
      return typeof payload.message === "string" ? payload.message : "Adapter warning";
    default:
      return event.type;
  }
}

function eventTone(event: StudioEvent): TimelineEntry["tone"] {
  if (event.type === "run.failed") return "error";
  if (event.type === "adapter.warning" || event.type === "run.cancelled") return "warning";
  if (event.type === "run.completed" || (event.type === "tool.completed" && event.payload.success !== false)) return "success";
  if (event.type === "tool.completed" && event.payload.success === false) return "error";
  return "normal";
}

function toolKey(event: StudioEvent) {
  const callId = event.payload.tool_call_id;
  if (typeof callId === "string" && callId) return callId;
  return `${event.payload.tool ?? "tool"}_${event.id}`;
}

function buildTimeline(events: StudioEvent[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const toolGroups = new Map<string, TimelineEntry>();
  let assistantGroup: TimelineEntry | null = null;

  for (const event of events) {
    if (event.type === "assistant.delta") {
      if (!assistantGroup) {
        assistantGroup = {
          id: `assistant_${event.id}`,
          type: "assistant.message",
          source: event.source,
          timestamp: event.timestamp,
          summary: "",
          tone: "normal",
          events: [],
        };
        entries.push(assistantGroup);
      }
      assistantGroup.events.push(event);
      assistantGroup.summary += summarizeEvent(event);
      continue;
    }

    assistantGroup = null;

    if (event.type === "tool.started" || event.type === "tool.progress" || event.type === "tool.completed") {
      const key = toolKey(event);
      const existing = toolGroups.get(key);
      if (existing) {
        existing.events.push(event);
        existing.summary = summarizeEvent(event);
        existing.tone = eventTone(event);
        continue;
      }
      const entry: TimelineEntry = {
        id: `tool_${key}`,
        type: "tool.call",
        source: event.source,
        timestamp: event.timestamp,
        summary: summarizeEvent(event),
        tone: eventTone(event),
        events: [event],
      };
      toolGroups.set(key, entry);
      entries.push(entry);
      continue;
    }

    entries.push({
      id: event.id,
      type: event.type,
      source: event.source,
      timestamp: event.timestamp,
      summary: summarizeEvent(event),
      tone: eventTone(event),
      events: [event],
    });
  }

  return entries;
}

function duration(run: RunRecord) {
  if (run.durationMs !== undefined) {
    const seconds = Math.max(0, Math.round(run.durationMs / 1000));
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }
  const start = Date.parse(run.startedAt);
  const end = Date.parse(run.completedAt ?? new Date().toISOString());
  if (Number.isNaN(start) || Number.isNaN(end)) return "n/a";
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

function runTitle(run: RunRecord) {
  return run.prompt || run.runId;
}

function copySummary(run: RunRecord) {
  const timeline = buildTimeline(run.events);
  const lines = [
    `Run: ${run.runId}`,
    `Status: ${run.status}`,
    `Session: ${run.sessionId ?? "none"}`,
    `Backend: ${run.backend ?? "unknown"}`,
    `Model: ${run.model ?? "unknown"}`,
    `Duration: ${duration(run)}`,
    "",
    `Prompt: ${run.prompt || "(not captured)"}`,
    "",
    "Timeline:",
    ...timeline.map((entry) => `- ${entry.type}: ${entry.summary}`),
  ];
  return navigator.clipboard?.writeText(lines.join("\n"));
}

export function RunLedger() {
  const runs = useRunLedgerStore((s) => s.runs);
  const selectedRunId = useRunLedgerStore((s) => s.selectedRunId);
  const currentRunId = useRunLedgerStore((s) => s.currentRunId);
  const selectedEventId = useRunLedgerStore((s) => s.selectedEventId);
  const loading = useRunLedgerStore((s) => s.loading);
  const error = useRunLedgerStore((s) => s.error);
  const historyAvailable = useRunLedgerStore((s) => s.historyAvailable);
  const savingRunCard = useRunLedgerStore((s) => s.savingRunCard);
  const actionMessage = useRunLedgerStore((s) => s.actionMessage);
  const selectRun = useRunLedgerStore((s) => s.selectRun);
  const selectEvent = useRunLedgerStore((s) => s.selectEvent);
  const loadRecentRuns = useRunLedgerStore((s) => s.loadRecentRuns);
  const loadRunLedger = useRunLedgerStore((s) => s.loadRunLedger);
  const createCardFromRun = useRunLedgerStore((s) => s.createCardFromRun);
  const clearActionMessage = useRunLedgerStore((s) => s.clearActionMessage);
  const setActiveTab = useLayoutStore((s) => s.setActiveTab);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const run = runs.find((item) => item.runId === selectedRunId)
    ?? runs.find((item) => item.runId === currentRunId)
    ?? runs[0]
    ?? null;
  const requestedLedgerIds = React.useRef(new Set<string>());
  const timeline = React.useMemo(() => buildTimeline(run?.events ?? []), [run?.events]);
  const selected = timeline.find((entry) => entry.id === selectedEventId)
    ?? timeline.find((entry) => entry.events.some((event) => event.id === selectedEventId))
    ?? timeline[0]
    ?? null;

  React.useEffect(() => {
    if (!run || run.events.length > 0 || run.runId.startsWith("pending_") || run.runId.startsWith("local_")) return;
    if (requestedLedgerIds.current.has(run.runId)) return;
    requestedLedgerIds.current.add(run.runId);
    void loadRunLedger(run.runId);
  }, [run, loadRunLedger]);

  async function handleCopySummary() {
    if (!run) return;
    try {
      await copySummary(run);
      clearActionMessage();
    } catch {
      // Clipboard can be unavailable in strict contexts; do not block the ledger.
    }
  }

  function openSession() {
    if (!run?.sessionId) return;
    setActiveSession(run.sessionId);
    setActiveTab("sessions");
  }

  if (!run && !loading) {
    return (
      <div className="workbench-empty">
        <div className="workbench-empty-title">No runs captured yet</div>
        <div className="workbench-empty-copy">
          Start a prompt from Chat and the run ledger will track stream, tool, approval, warning, memory, and board events here.
        </div>
        {error && <div className="inline-warning">Run history unavailable: {error}</div>}
        <button className="tool-button" onClick={() => void loadRecentRuns()}>Refresh Run History</button>
      </div>
    );
  }

  return (
    <div className="run-ledger">
      <div className="run-ledger-header">
        <div>
          <div className="workbench-eyebrow">Run Ledger</div>
          <div className="run-ledger-title">{run ? runTitle(run) : "Loading run history"}</div>
        </div>
        <div className="run-ledger-actions">
          {run && <button className="tool-button" onClick={() => void createCardFromRun(run.runId)} disabled={savingRunCard}>Create Card from Run</button>}
          {run && <button className="tool-button" onClick={() => void handleCopySummary()}>Copy Run Summary</button>}
          {run?.sessionId && <button className="tool-button" onClick={openSession}>Open Related Session</button>}
          <button className="tool-button" onClick={() => void loadRecentRuns()}>{loading ? "Refreshing" : "Refresh"}</button>
        </div>
      </div>

      {run && (
        <div className="run-ledger-meta">
          <span className={`status-pill status-${run.status}`}>{run.status}</span>
          <span>Run {run.runId}</span>
          <span>Session {run.sessionId ?? "none"}</span>
          <span>Backend {run.backend ?? "live"}</span>
          <span>Model {run.model ?? "unknown"}</span>
          <span>{run.events.length} events</span>
          <span>{duration(run)}</span>
          <span>Started {formatTime(run.startedAt)}</span>
          {run.completedAt && <span>Ended {formatTime(run.completedAt)}</span>}
        </div>
      )}

      {(!historyAvailable || error || actionMessage) && (
        <div className="run-ledger-notice">
          {error && <span>Run history unavailable: {error}</span>}
          {!error && !historyAvailable && <span>Run history is unavailable; live runs can still stream.</span>}
          {actionMessage && <span>{actionMessage}</span>}
        </div>
      )}

      <div className="run-ledger-body">
        <div className="recent-runs-list selectable">
          <div className="pane-label">Recent Runs</div>
          {runs.map((item) => (
            <button
              key={item.runId}
              className={`recent-run-item ${run?.runId === item.runId ? "active" : ""}`}
              onClick={() => {
                selectRun(item.runId);
                if (item.events.length === 0) void loadRunLedger(item.runId);
              }}
            >
              <span className="recent-run-title">{runTitle(item)}</span>
              <span className="recent-run-meta">
                <span className={`status-dot status-${item.status}`} />
                {item.status}
                {item.sessionId ? ` - ${item.sessionId}` : ""}
              </span>
            </button>
          ))}
        </div>

        <div className="timeline-list selectable">
          {timeline.length === 0 && (
            <div className="workbench-empty compact">No events persisted for this run yet. Live events will appear as the stream arrives.</div>
          )}
          {timeline.map((entry) => (
            <button
              key={entry.id}
              className={`timeline-entry ${entry.tone} ${selected?.id === entry.id ? "active" : ""}`}
              onClick={() => selectEvent(entry.id)}
            >
              <span className="timeline-marker" />
              <span className="timeline-main">
                <span className="timeline-type">{entry.type}</span>
                <span className="timeline-summary">{entry.summary}</span>
              </span>
              <span className="timeline-side">
                <span>{entry.source}</span>
                <span>{formatTime(entry.timestamp)}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="event-detail selectable">
          {selected ? (
            <>
              <div className="event-detail-header">
                <div>
                  <div className="workbench-eyebrow">Selected Event</div>
                  <div className="event-detail-title">{selected.type}</div>
                </div>
                <span>{formatTime(selected.timestamp)}</span>
              </div>
              <dl className="event-detail-meta">
                <dt>Source</dt>
                <dd>{selected.source}</dd>
                <dt>Events</dt>
                <dd>{selected.events.length}</dd>
                <dt>Run</dt>
                <dd>{run?.runId ?? "none"}</dd>
              </dl>
              <pre className="event-payload">{JSON.stringify(selected.events.map((event) => event.payload), null, 2)}</pre>
            </>
          ) : (
            <div className="workbench-empty compact">Select an event to inspect payload details.</div>
          )}
        </div>
      </div>
    </div>
  );
}

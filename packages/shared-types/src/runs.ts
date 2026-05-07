import type { StudioEvent } from "./events";

export type RunLedgerStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "stopping"
  | "idle";

export interface RunLedgerRun {
  id: string;
  session_id: string | null;
  status: RunLedgerStatus;
  title: string | null;
  prompt_preview: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  backend: string;
  model: string | null;
  error: string | null;
}

export type RunLedgerEvent = StudioEvent;

export interface RunLedgerRecentResponse {
  runs: RunLedgerRun[];
  total: number;
  history_available: boolean;
}

export interface RunLedgerResponse {
  run: RunLedgerRun;
  events: RunLedgerEvent[];
  history_available: boolean;
}

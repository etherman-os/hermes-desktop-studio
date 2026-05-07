import { create } from "zustand";
import type { ContextScope, ContextSnapshot } from "../api/studioClient";
import * as api from "../api/studioClient";

interface ContextState {
  snapshot: ContextSnapshot | null;
  selectedScope: ContextScope;
  selectedRunId: string | null;
  selectedSessionId: string | null;
  loading: boolean;
  error: string | null;
  lastLoadedAt: string | null;
  loadCurrentContext: (workspacePath?: string | null) => Promise<void>;
  loadWorkspaceContext: (workspacePath?: string | null) => Promise<void>;
  loadRunContext: (runId: string) => Promise<void>;
  loadSessionContext: (sessionId: string) => Promise<void>;
  refresh: (workspacePath?: string | null) => Promise<void>;
}

function messageFromError(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

export const useContextStore = create<ContextState>((set, get) => ({
  snapshot: null,
  selectedScope: "current",
  selectedRunId: null,
  selectedSessionId: null,
  loading: false,
  error: null,
  lastLoadedAt: null,

  loadCurrentContext: async (workspacePath) => {
    set({ loading: true, error: null, selectedScope: "current", selectedRunId: null, selectedSessionId: null });
    try {
      const snapshot = await api.getCurrentContext(workspacePath);
      set({ snapshot, loading: false, lastLoadedAt: nowIso() });
    } catch (err) {
      set({ loading: false, error: messageFromError(err, "Context unavailable") });
    }
  },

  loadWorkspaceContext: async (workspacePath) => {
    set({ loading: true, error: null, selectedScope: "workspace", selectedRunId: null, selectedSessionId: null });
    try {
      const snapshot = await api.getCurrentWorkspaceContext(workspacePath);
      set({ snapshot, loading: false, lastLoadedAt: nowIso() });
    } catch (err) {
      set({ loading: false, error: messageFromError(err, "Workspace context unavailable") });
    }
  },

  loadRunContext: async (runId) => {
    set({ loading: true, error: null, selectedScope: "run", selectedRunId: runId, selectedSessionId: null });
    try {
      const snapshot = await api.getRunContext(runId);
      set({ snapshot, loading: false, lastLoadedAt: nowIso() });
    } catch (err) {
      set({ loading: false, error: messageFromError(err, "Run context unavailable") });
    }
  },

  loadSessionContext: async (sessionId) => {
    set({ loading: true, error: null, selectedScope: "session", selectedRunId: null, selectedSessionId: sessionId });
    try {
      const snapshot = await api.getSessionContext(sessionId);
      set({ snapshot, loading: false, lastLoadedAt: nowIso() });
    } catch (err) {
      set({ loading: false, error: messageFromError(err, "Session context unavailable") });
    }
  },

  refresh: async (workspacePath) => {
    const state = get();
    if (state.selectedScope === "run" && state.selectedRunId) {
      await state.loadRunContext(state.selectedRunId);
      return;
    }
    if (state.selectedScope === "session" && state.selectedSessionId) {
      await state.loadSessionContext(state.selectedSessionId);
      return;
    }
    if (state.selectedScope === "workspace") {
      await state.loadWorkspaceContext(workspacePath);
      return;
    }
    await state.loadCurrentContext(workspacePath);
  },
}));

import { create } from "zustand";
import * as api from "../api/studioClient";

interface ChatMessage {
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  toolStatus?: "running" | "completed" | "failed";
  toolDuration?: number;
}

interface RunState {
  isStreaming: boolean;
  activeRunId: string | null;
  messages: ChatMessage[];
  abortController: AbortController | null;
  sendPrompt: (prompt: string, sessionId: string) => Promise<void>;
  stopRun: () => Promise<void>;
  appendUserMessage: (content: string) => void;
  appendAssistantChunk: (text: string) => void;
  addToolEvent: (tool: string, status: "running" | "completed" | "failed", duration?: number) => void;
  finalizeRun: () => void;
  setStreaming: (v: boolean) => void;
}

export const useRunStore = create<RunState>((set, get) => ({
  isStreaming: false,
  activeRunId: null,
  messages: [
    { role: "assistant" as const, content: "Welcome to Hermes Desktop Studio. How can I help you today?" },
  ],
  abortController: null,

  appendUserMessage: (content) => {
    set((s) => ({ messages: [...s.messages, { role: "user" as const, content }] }));
  },

  appendAssistantChunk: (text) => {
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant" && last.toolName === undefined) {
        last.content += text;
      } else {
        msgs.push({ role: "assistant" as const, content: text });
      }
      return { messages: msgs };
    });
  },

  addToolEvent: (tool, status, duration) => {
    set((s) => ({
      messages: [
        ...s.messages,
        { role: "tool" as const, content: tool, toolName: tool, toolStatus: status, toolDuration: duration },
      ],
    }));
  },

  sendPrompt: async (prompt, sessionId) => {
    const state = get();
    if (state.isStreaming) return;

    state.appendUserMessage(prompt);
    set({ isStreaming: true });

    try {
      const run = await api.startRun({ session_id: sessionId, prompt });
      set({ activeRunId: run.run_id });

      const ac = api.streamRunEvents(run.run_id, {
        onAssistantDelta: (p) => get().appendAssistantChunk(p.text),
        onToolStarted: (p) => get().addToolEvent(p.tool, "running"),
        onToolCompleted: (p) => get().addToolEvent(p.tool, "completed", p.duration_ms),
        onRunCompleted: () => get().finalizeRun(),
        onRunFailed: (p) => {
          get().appendAssistantChunk(`\n[Error: ${p.message}]`);
          get().finalizeRun();
        },
        onRunCancelled: () => get().finalizeRun(),
        onError: (err) => {
          get().appendAssistantChunk(`\n[Adapter error: ${err.message}]`);
          get().finalizeRun();
        },
        onDone: () => get().finalizeRun(),
      });

      set({ abortController: ac });
    } catch (err) {
      get().appendAssistantChunk(`\n[Failed to start run: ${err instanceof Error ? err.message : String(err)}]`);
      set({ isStreaming: false });
    }
  },

  stopRun: async () => {
    const { activeRunId, abortController } = get();
    if (abortController) abortController.abort();
    if (activeRunId) {
      try { await api.stopRun(activeRunId); } catch { /* ignore */ }
    }
    set({ isStreaming: false, activeRunId: null, abortController: null });
  },

  finalizeRun: () => {
    set({ isStreaming: false, activeRunId: null, abortController: null });
  },

  setStreaming: (v) => set({ isStreaming: v }),
}));

import { create } from "zustand";

interface RunState {
  isStreaming: boolean;
  activeRunId: string | null;
  setStreaming: (v: boolean) => void;
  setActiveRun: (id: string | null) => void;
}

export const useRunStore = create<RunState>((set) => ({
  isStreaming: false,
  activeRunId: null,
  setStreaming: (v) => set({ isStreaming: v }),
  setActiveRun: (id) => set({ activeRunId: id }),
}));

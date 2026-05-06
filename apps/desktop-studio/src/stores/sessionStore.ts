import { create } from "zustand";
import * as api from "../api/studioClient";

interface Session {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  profile?: string;
}

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
  searchQuery: string;
  loaded: boolean;
  setActiveSession: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  loadFromAdapter: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  activeSessionId: "s-1",
  searchQuery: "",
  loaded: false,

  setActiveSession: (id) => set({ activeSessionId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  loadFromAdapter: async () => {
    try {
      const data = await api.getSessions();
      const sessions = data.sessions.map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        messageCount: s.message_count,
      }));
      set({ sessions, loaded: true });
    } catch {
      // keep empty, fallback to local fixtures if needed
    }
  },
}));

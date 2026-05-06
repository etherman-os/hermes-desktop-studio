import { create } from "zustand";
import { mockSessions } from "../fixtures/mockData";

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
  setActiveSession: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: mockSessions,
  activeSessionId: "s-1",
  searchQuery: "",

  setActiveSession: (id) => set({ activeSessionId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));

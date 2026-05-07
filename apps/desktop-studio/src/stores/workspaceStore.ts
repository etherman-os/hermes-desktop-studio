import { create } from "zustand";

const STORAGE_KEY = "hermes-studio-workspaces";

interface PersistedWorkspaceState {
  selectedWorkspace: string | null;
  recentWorkspaces: string[];
}

interface WorkspaceState extends PersistedWorkspaceState {
  loaded: boolean;
  load: () => void;
  selectWorkspace: (path: string | null) => void;
  clearWorkspace: () => void;
}

function cleanPath(path: string | null) {
  const trimmed = path?.trim();
  return trimmed ? trimmed : null;
}

function readPersisted(): PersistedWorkspaceState {
  if (typeof localStorage === "undefined") {
    return { selectedWorkspace: null, recentWorkspaces: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { selectedWorkspace: null, recentWorkspaces: [] };
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceState>;
    return {
      selectedWorkspace: cleanPath(parsed.selectedWorkspace ?? null),
      recentWorkspaces: Array.isArray(parsed.recentWorkspaces)
        ? parsed.recentWorkspaces.map((item) => cleanPath(String(item))).filter(Boolean).slice(0, 8) as string[]
        : [],
    };
  } catch {
    return { selectedWorkspace: null, recentWorkspaces: [] };
  }
}

function persist(state: PersistedWorkspaceState) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  selectedWorkspace: null,
  recentWorkspaces: [],
  loaded: false,

  load: () => {
    const persisted = readPersisted();
    set({ ...persisted, loaded: true });
  },

  selectWorkspace: (path) => {
    const selectedWorkspace = cleanPath(path);
    const recentWorkspaces = selectedWorkspace
      ? [selectedWorkspace, ...get().recentWorkspaces.filter((item) => item !== selectedWorkspace)].slice(0, 8)
      : get().recentWorkspaces;
    const next = { selectedWorkspace, recentWorkspaces };
    persist(next);
    set({ ...next, loaded: true });
  },

  clearWorkspace: () => {
    const next = { selectedWorkspace: null, recentWorkspaces: get().recentWorkspaces };
    persist(next);
    set(next);
  },
}));

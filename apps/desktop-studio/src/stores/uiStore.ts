import { create } from "zustand";
import type { NewRunDraft } from "../lib/runPresets";

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

interface UiState {
  commandPaletteOpen: boolean;
  newRunOpen: boolean;
  newRunDraft: NewRunDraft | null;
  workspacePickerOpen: boolean;
  commandPaletteQuery: string;
  commands: CommandItem[];
  selectedCommandIndex: number;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openNewRun: (draft?: NewRunDraft) => void;
  closeNewRun: () => void;
  openWorkspacePicker: () => void;
  closeWorkspacePicker: () => void;
  setCommandPaletteQuery: (q: string) => void;
  setSelectedCommandIndex: (i: number) => void;
  registerCommands: (cmds: CommandItem[]) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  newRunOpen: false,
  newRunDraft: null,
  workspacePickerOpen: false,
  commandPaletteQuery: "",
  commands: [],
  selectedCommandIndex: 0,

  openCommandPalette: () => set({ commandPaletteOpen: true, commandPaletteQuery: "", selectedCommandIndex: 0 }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  openNewRun: (draft) => set({ newRunOpen: true, newRunDraft: draft ?? null }),
  closeNewRun: () => set({ newRunOpen: false, newRunDraft: null }),
  openWorkspacePicker: () => set({ workspacePickerOpen: true }),
  closeWorkspacePicker: () => set({ workspacePickerOpen: false }),
  setCommandPaletteQuery: (q) => set({ commandPaletteQuery: q, selectedCommandIndex: 0 }),
  setSelectedCommandIndex: (i) => set({ selectedCommandIndex: i }),
  registerCommands: (cmds) => set({ commands: cmds }),
}));

import { create } from "zustand";

interface CommandItem {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
}

interface UiState {
  commandPaletteOpen: boolean;
  commandPaletteQuery: string;
  commands: CommandItem[];
  selectedCommandIndex: number;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  setCommandPaletteQuery: (q: string) => void;
  setSelectedCommandIndex: (i: number) => void;
  registerCommands: (cmds: CommandItem[]) => void;
}

export const useUiStore = create<UiState>((set) => ({
  commandPaletteOpen: false,
  commandPaletteQuery: "",
  commands: [],
  selectedCommandIndex: 0,

  openCommandPalette: () => set({ commandPaletteOpen: true, commandPaletteQuery: "", selectedCommandIndex: 0 }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  setCommandPaletteQuery: (q) => set({ commandPaletteQuery: q, selectedCommandIndex: 0 }),
  setSelectedCommandIndex: (i) => set({ selectedCommandIndex: i }),
  registerCommands: (cmds) => set({ commands: cmds }),
}));

import { create } from "zustand";
import type { ThemePack } from "@hermes-studio/shared-types";
import { ALL_THEMES } from "../fixtures/themes";
import { applyThemeToDOM } from "../styles/applyTheme";

interface ThemeState {
  activeThemeId: string;
  themes: Record<string, ThemePack>;
  activeTheme: () => ThemePack;
  label: (slot: string) => string;
  icon: (slot: string) => string;
  setTheme: (id: string) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeThemeId: "default-dark",
  themes: ALL_THEMES,

  activeTheme: () => {
    const { activeThemeId, themes } = get();
    return themes[activeThemeId] ?? themes["default-dark"];
  },

  label: (slot: string) => {
    const theme = get().activeTheme();
    return theme.labels?.[slot as keyof typeof theme.labels] ?? slot;
  },

  icon: (slot: string) => {
    const theme = get().activeTheme();
    return theme.icons?.[slot as keyof typeof theme.icons] ?? "•";
  },

  setTheme: (id: string) => {
    const theme = get().themes[id];
    if (!theme) return;
    set({ activeThemeId: id });
    applyThemeToDOM(theme);
  },

  initTheme: () => {
    const theme = get().activeTheme();
    applyThemeToDOM(theme);
  },
}));

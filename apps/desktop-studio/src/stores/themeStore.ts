import { create } from "zustand";
import type { ThemePack } from "@hermes-studio/shared-types";
import { ALL_THEMES } from "../fixtures/themes";
import { applyThemeToDOM } from "../styles/applyTheme";
import * as api from "../api/studioClient";

interface ThemeState {
  activeThemeId: string;
  themes: Record<string, ThemePack>;
  adapterThemes: api.ThemeInfo[];
  adapterLoaded: boolean;
  activeTheme: () => ThemePack;
  label: (slot: string) => string;
  icon: (slot: string) => string;
  setTheme: (id: string) => void;
  activateTheme: (id: string) => Promise<void>;
  initTheme: () => void;
  loadFromAdapter: () => Promise<void>;
  reloadThemes: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  activeThemeId: "default-dark",
  themes: ALL_THEMES,
  adapterThemes: [],
  adapterLoaded: false,

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

  activateTheme: async (id: string) => {
    try {
      await api.activateTheme(id);
      // Load the full theme data from adapter
      const normalized = await api.getTheme(id);
      const themePack = adapterThemeToPack(normalized);
      set((s) => ({
        activeThemeId: id,
        themes: { ...s.themes, [id]: themePack },
      }));
      applyThemeToDOM(themePack);
    } catch {
      // Fallback to local theme
      get().setTheme(id);
    }
  },

  initTheme: () => {
    const theme = get().activeTheme();
    applyThemeToDOM(theme);
  },

  loadFromAdapter: async () => {
    try {
      const data = await api.getThemes();
      const adapterThemes = data.themes;
      set({ adapterThemes, adapterLoaded: true });

      // Load active theme from adapter
      try {
        const active = await api.getActiveTheme();
        const themePack = adapterThemeToPack(active);
        const activeId = data.active ?? "default-dark";
        set((s) => ({
          activeThemeId: activeId,
          themes: { ...s.themes, [activeId]: themePack },
        }));
        applyThemeToDOM(themePack);
      } catch {
        // Keep local fallback
      }
    } catch {
      set({ adapterLoaded: true });
      // Keep local fallback themes
    }
  },

  reloadThemes: async () => {
    try {
      await api.reloadThemes();
      await get().loadFromAdapter();
    } catch {
      // ignore
    }
  },
}));

function adapterThemeToPack(data: api.ThemeData): ThemePack {
  return {
    meta: {
      id: data.meta?.id ?? "unknown",
      name: data.meta?.name ?? "Unknown",
      version: data.meta?.version ?? "0.0.0",
      author: data.meta?.author ?? "unknown",
      description: data.meta?.description,
      extends: data.meta?.extends,
    },
    palette: data.palette as ThemePack["palette"],
    typography: data.typography as ThemePack["typography"],
    borders: data.borders as ThemePack["borders"],
    icons: data.icons as ThemePack["icons"],
    labels: data.labels as ThemePack["labels"],
    empty_states: data.empty_states as ThemePack["empty_states"],
    onboarding: data.onboarding as ThemePack["onboarding"],
    kanban: data.kanban as ThemePack["kanban"],
    message_styles: data.message_styles as ThemePack["message_styles"],
    accessibility: data.accessibility as ThemePack["accessibility"],
    assets: data.assets as ThemePack["assets"],
  };
}

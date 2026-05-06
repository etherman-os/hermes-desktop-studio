import { create } from "zustand";
import * as api from "../api/studioClient";

interface AdapterState {
  connected: boolean;
  checking: boolean;
  backendMode: string;
  activeBackend: string;
  hermesConnected: boolean;
  fallbackReason: string | null;
  setConnected: (v: boolean) => void;
  checkConnection: () => Promise<boolean>;
}

export const useAdapterStore = create<AdapterState>((set) => ({
  connected: false,
  checking: false,
  backendMode: "unknown",
  activeBackend: "unknown",
  hermesConnected: false,
  fallbackReason: null,
  setConnected: (v) => set({ connected: v }),

  checkConnection: async () => {
    set({ checking: true });
    try {
      const health = await api.checkAdapterHealthDetailed();
      const bs = health.backend_status;
      set({
        connected: true,
        checking: false,
        backendMode: bs?.backend_mode ?? health.backend_mode ?? "unknown",
        activeBackend: bs?.active_backend ?? bs?.backend_mode ?? health.backend_mode ?? "unknown",
        hermesConnected: bs?.hermes_connected ?? health.hermes_connected ?? false,
        fallbackReason: bs?.fallback_reason ?? null,
      });
      return true;
    } catch {
      set({
        connected: false,
        checking: false,
        backendMode: "unknown",
        activeBackend: "unknown",
        hermesConnected: false,
        fallbackReason: null,
      });
      return false;
    }
  },
}));

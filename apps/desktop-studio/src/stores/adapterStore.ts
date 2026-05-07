import { create } from "zustand";
import * as api from "../api/studioClient";

interface AdapterState {
  connected: boolean;
  checking: boolean;
  authReady: boolean;
  authError: string | null;
  backendMode: string;
  activeBackend: string;
  hermesConnected: boolean;
  hermesUrl: string;
  storageAvailable: boolean;
  storageError: string | null;
  storageSchemaVersion: number;
  fallbackReason: string | null;
  lastCheckedAt: string | null;
  setConnected: (v: boolean) => void;
  checkConnection: () => Promise<boolean>;
}

export const useAdapterStore = create<AdapterState>((set) => ({
  connected: false,
  checking: false,
  authReady: false,
  authError: null,
  backendMode: "unknown",
  activeBackend: "unknown",
  hermesConnected: false,
  hermesUrl: "unknown",
  storageAvailable: false,
  storageError: null,
  storageSchemaVersion: 0,
  fallbackReason: null,
  lastCheckedAt: null,
  setConnected: (v) => set({ connected: v }),

  checkConnection: async () => {
    set({ checking: true });
    try {
      const auth = await api.initializeAdapterAuth();
      if (!auth.authenticated) {
        const message = auth.error ?? "Adapter auth token is unavailable";
        set({
          connected: false,
          checking: false,
          authReady: false,
          authError: message,
          backendMode: "unknown",
          activeBackend: "unknown",
          hermesConnected: false,
          hermesUrl: "unknown",
          storageAvailable: false,
          storageError: null,
          storageSchemaVersion: 0,
          fallbackReason: message,
          lastCheckedAt: new Date().toISOString(),
        });
        return false;
      }

      const health = await api.checkAdapterHealthDetailed();
      const bs = health.backend_status;
      const storage = health.storage;
      set({
        connected: true,
        checking: false,
        authReady: true,
        authError: null,
        backendMode: bs?.backend_mode ?? health.backend_mode ?? "unknown",
        activeBackend: bs?.active_backend ?? bs?.backend_mode ?? health.backend_mode ?? "unknown",
        hermesConnected: bs?.hermes_connected ?? health.hermes_connected ?? false,
        hermesUrl: bs?.hermes_url ?? "unknown",
        storageAvailable: storage?.available ?? false,
        storageError: storage?.last_error ?? null,
        storageSchemaVersion: storage?.schema_version ?? 0,
        fallbackReason: bs?.fallback_reason ?? null,
        lastCheckedAt: new Date().toISOString(),
      });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Adapter connection failed";
      set({
        connected: false,
        checking: false,
        authReady: api.hasAdapterToken(),
        authError: null,
        backendMode: "unknown",
        activeBackend: "unknown",
        hermesConnected: false,
        hermesUrl: "unknown",
        storageAvailable: false,
        storageError: null,
        storageSchemaVersion: 0,
        fallbackReason: message,
        lastCheckedAt: new Date().toISOString(),
      });
      return false;
    }
  },
}));

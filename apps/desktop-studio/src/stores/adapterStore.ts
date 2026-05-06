import { create } from "zustand";
import * as api from "../api/studioClient";

interface AdapterState {
  connected: boolean;
  checking: boolean;
  token: string | null;
  setConnected: (v: boolean) => void;
  setToken: (t: string) => void;
  checkConnection: () => Promise<boolean>;
}

export const useAdapterStore = create<AdapterState>((set, get) => ({
  connected: false,
  checking: false,
  token: null,

  setConnected: (v) => set({ connected: v }),
  setToken: (t) => {
    set({ token: t });
    api.setAdapterToken(t);
  },

  checkConnection: async () => {
    set({ checking: true });
    const ok = await api.checkAdapterHealth();
    set({ connected: ok, checking: false });
    return ok;
  },
}));

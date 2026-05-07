import { create } from "zustand";

interface LayoutState {
  activeTab: string;
  sidebarCollapsed: boolean;
  showRightPanel: boolean;
  showBottomPanel: boolean;
  sidebarSection: string;
  bottomTab: string;
  setActiveTab: (tab: string) => void;
  showSidebar: () => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setSidebarSection: (section: string) => void;
  setBottomTab: (tab: string) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activeTab: "runs",
  sidebarCollapsed: false,
  showRightPanel: true,
  showBottomPanel: true,
  sidebarSection: "runs",
  bottomTab: "activity",

  setActiveTab: (tab) => set({ activeTab: tab }),
  showSidebar: () => set({ sidebarCollapsed: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleRightPanel: () => set((s) => ({ showRightPanel: !s.showRightPanel })),
  toggleBottomPanel: () => set((s) => ({ showBottomPanel: !s.showBottomPanel })),
  setSidebarSection: (section) => set({ sidebarSection: section }),
  setBottomTab: (tab) => set({ bottomTab: tab }),
}));

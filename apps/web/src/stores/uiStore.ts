import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelHeight: number;
  activeBottomTab: 'metrics' | 'logs' | 'alerts';
  showExportModal: boolean;
  showImportModal: boolean;
  showAnalysisModal: boolean;
  showChaosPanel: boolean;
  showTemplateSelector: boolean;
  showSettings: boolean;
  showInfraImport: boolean;
  showSimConfig: boolean;
  theme: 'dark' | 'light';
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  toggleBottomPanel: () => void;
  setBottomPanelHeight: (h: number) => void;
  setActiveBottomTab: (tab: 'metrics' | 'logs' | 'alerts') => void;
  setShowExportModal: (show: boolean) => void;
  setShowImportModal: (show: boolean) => void;
  setShowAnalysisModal: (show: boolean) => void;
  setShowChaosPanel: (show: boolean) => void;
  setShowTemplateSelector: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowInfraImport: (show: boolean) => void;
  setShowSimConfig: (show: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      leftSidebarOpen: true,
      rightSidebarOpen: true,
      bottomPanelOpen: false,
      bottomPanelHeight: 280,
      activeBottomTab: 'metrics',
      showExportModal: false,
      showImportModal: false,
      showAnalysisModal: false,
      showChaosPanel: false,
      showTemplateSelector: false,
      showSettings: false,
      showInfraImport: false,
      showSimConfig: false,
      theme: 'dark',

      toggleLeftSidebar: () => set({ leftSidebarOpen: !get().leftSidebarOpen }),
      toggleRightSidebar: () => set({ rightSidebarOpen: !get().rightSidebarOpen }),
      toggleBottomPanel: () => set({ bottomPanelOpen: !get().bottomPanelOpen }),
      setBottomPanelHeight: (h) => set({ bottomPanelHeight: Math.max(150, Math.min(500, h)) }),
      setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
      setShowExportModal: (show) => set({ showExportModal: show }),
      setShowImportModal: (show) => set({ showImportModal: show }),
      setShowAnalysisModal: (show) => set({ showAnalysisModal: show }),
      setShowChaosPanel: (show) => set({ showChaosPanel: show }),
      setShowTemplateSelector: (show) => set({ showTemplateSelector: show }),
      setShowSettings: (show) => set({ showSettings: show }),
      setShowInfraImport: (show) => set({ showInfraImport: show }),
      setShowSimConfig: (show) => set({ showSimConfig: show }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    {
      name: 'systemtwin-ui',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        leftSidebarOpen: state.leftSidebarOpen,
        rightSidebarOpen: state.rightSidebarOpen,
        bottomPanelOpen: state.bottomPanelOpen,
        bottomPanelHeight: state.bottomPanelHeight,
        activeBottomTab: state.activeBottomTab,
        showTemplateSelector: state.showTemplateSelector,
        theme: state.theme,
      }),
    }
  )
);

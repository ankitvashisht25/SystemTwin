import { useState, useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import TopBar from './components/topbar/TopBar';
import ComponentLibrary from './components/sidebar/ComponentLibrary';
import ArchitectureCanvas from './components/canvas/ArchitectureCanvas';
import ConfigPanel from './components/config-panel/ConfigPanel';
import ObservabilityPanel from './components/observability/ObservabilityPanel';
import ExportModal from './components/topbar/ExportModal';
import ImportModal from './components/import/ImportModal';
import AnalysisReport from './components/simulation/AnalysisReport';
import ChaosPanel from './components/simulation/ChaosPanel';
import SimulationBar from './components/simulation/SimulationBar';
import LandingPage from './components/landing/LandingPage';
import AuthPage from './components/auth/AuthPage';
import SavedArchitectures from './components/auth/SavedArchitectures';
import TemplateSelector from './components/templates/TemplateSelector';
import SettingsModal from './components/settings/SettingsModal';
import InfraImportModal from './components/import/InfraImportModal';
import SimulationConfigPanel from './components/simulation/SimulationConfigPanel';
import { useUIStore } from './stores/uiStore';
import { useAuthStore } from './stores/authStore';
import { useSimulationSocket, useSimulationActions } from './hooks/useSimulation';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function Workspace() {
  // Single socket connection for the entire workspace
  useSimulationSocket();

  // Global keyboard shortcuts (undo/redo, save, export, escape)
  useKeyboardShortcuts();

  // Theme management
  const theme = useUIStore((s) => s.theme);
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const leftSidebarOpen = useUIStore((s) => s.leftSidebarOpen);
  const rightSidebarOpen = useUIStore((s) => s.rightSidebarOpen);
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);
  const bottomPanelHeight = useUIStore((s) => s.bottomPanelHeight);
  const showExportModal = useUIStore((s) => s.showExportModal);
  const showImportModal = useUIStore((s) => s.showImportModal);
  const setShowImportModal = useUIStore((s) => s.setShowImportModal);
  const showAnalysisModal = useUIStore((s) => s.showAnalysisModal);
  const showChaosPanel = useUIStore((s) => s.showChaosPanel);
  const showTemplateSelector = useUIStore((s) => s.showTemplateSelector);
  const setShowTemplateSelector = useUIStore((s) => s.setShowTemplateSelector);
  const showSettings = useUIStore((s) => s.showSettings);
  const setShowSettings = useUIStore((s) => s.setShowSettings);
  const showInfraImport = useUIStore((s) => s.showInfraImport);
  const setShowInfraImport = useUIStore((s) => s.setShowInfraImport);
  const showSimConfig = useUIStore((s) => s.showSimConfig);
  const setShowSimConfig = useUIStore((s) => s.setShowSimConfig);
  const { startSimulation } = useSimulationActions();
  const [showSaved, setShowSaved] = useState(false);

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-surface-900 text-gray-100 overflow-hidden">
        <TopBar onOpenSaved={() => setShowSaved(true)} />
        <SimulationBar />

        <div className="flex-1 flex overflow-hidden">
          {leftSidebarOpen && (
            <div className="w-64 border-r border-border flex-shrink-0 overflow-y-auto bg-surface-800">
              <ComponentLibrary />
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 relative">
              <ArchitectureCanvas />
              {showChaosPanel && (
                <div className="absolute top-3 right-3" style={{ zIndex: 100, pointerEvents: 'auto' }}>
                  <ChaosPanel />
                </div>
              )}
            </div>

            {bottomPanelOpen && (
              <div
                className="border-t border-border bg-surface-800 flex-shrink-0"
                style={{ height: bottomPanelHeight }}
              >
                <ObservabilityPanel />
              </div>
            )}
          </div>

          {rightSidebarOpen && (
            <div className="w-80 border-l border-border flex-shrink-0 overflow-y-auto bg-surface-800">
              <ConfigPanel />
            </div>
          )}
        </div>

        {showExportModal && <ExportModal />}
        {showImportModal && <ImportModal onClose={() => setShowImportModal(false)} />}
        {showAnalysisModal && <AnalysisReport />}
        {showSaved && <SavedArchitectures onClose={() => setShowSaved(false)} />}
        {showTemplateSelector && <TemplateSelector onClose={() => setShowTemplateSelector(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        {showInfraImport && <InfraImportModal onClose={() => setShowInfraImport(false)} />}
        {showSimConfig && <SimulationConfigPanel onClose={() => setShowSimConfig(false)} onStart={startSimulation} />}
      </div>
    </ReactFlowProvider>
  );
}

type AppView = 'landing' | 'auth' | 'workspace' | 'loading';

const VIEW_KEY = 'systemtwin_view';

function getInitialView(): AppView {
  const token = localStorage.getItem('systemtwin_token');
  if (!token) return 'landing';

  // Token exists — check if user was previously in workspace
  const saved = sessionStorage.getItem(VIEW_KEY);
  if (saved === 'workspace') return 'loading'; // will verify token then go to workspace
  return 'loading';
}

export default function App() {
  const { isAuthenticated, loading, loadUser } = useAuthStore();
  const token = useAuthStore((s) => s.token);
  const [view, setView] = useState<AppView>(getInitialView);

  // Persist view to sessionStorage whenever it changes
  useEffect(() => {
    if (view === 'workspace' || view === 'landing') {
      sessionStorage.setItem(VIEW_KEY, view);
    }
  }, [view]);

  // Load user on mount if token exists
  useEffect(() => {
    if (token) {
      loadUser();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // React to auth state changes — only act once loading is done
  useEffect(() => {
    if (loading) return;

    if (isAuthenticated) {
      if (view === 'loading' || view === 'auth') {
        setView('workspace');
      }
    } else {
      if (view === 'loading') {
        // Token was invalid — go to landing
        sessionStorage.removeItem(VIEW_KEY);
        setView('landing');
      } else if (view === 'workspace') {
        // Logged out while in workspace
        sessionStorage.removeItem(VIEW_KEY);
        setView('auth');
      }
    }
  }, [isAuthenticated, loading, view]);

  // Body class for landing page scrolling
  useEffect(() => {
    if (view === 'landing') {
      document.body.classList.add('landing-active');
    } else {
      document.body.classList.remove('landing-active');
    }
  }, [view]);

  // Loading spinner while verifying token
  if (view === 'loading') {
    return (
      <div className="h-screen w-screen bg-[#060a13] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-[11px] text-gray-600 font-mono">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <LandingPage
        onEnterApp={() => {
          if (isAuthenticated) {
            setView('workspace');
          } else {
            setView('auth');
          }
        }}
      />
    );
  }

  if (view === 'auth' || !isAuthenticated) {
    return <AuthPage />;
  }

  return <Workspace />;
}

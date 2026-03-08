import { useCallback, useState } from 'react';
import {
  Save, Download, Upload, Play, Square, Zap, BarChart3, LayoutTemplate,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  ChevronDown, ChevronUp, Activity, Trash2, Check, Sun, Moon, Users,
  CloudDownload, Settings2, FolderOpen, MoreHorizontal
} from 'lucide-react';
import { useProjectStore } from '../../stores/projectStore';
import { useArchitectureStore } from '../../stores/architectureStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useUIStore } from '../../stores/uiStore';
import { useCollaborationStore } from '../../stores/collaborationStore';
import { useSimulationActions } from '../../hooks/useSimulation';
import { apiFetch } from '../../lib/api';
import UserMenu from '../auth/UserMenu';

export default function TopBar({ onOpenSaved }: { onOpenSaved: () => void }) {
  const { projectId, architectureName, setArchitectureName, setProjectId, markSaved } = useProjectStore();
  const { nodes, getArchitectureData, clearCanvas } = useArchitectureStore();
  const collaborators = useCollaborationStore((s) => s.collaborators);
  const isCollaborating = useCollaborationStore((s) => s.isCollaborating);
  const simStatus = useSimulationStore((s) => s.status);
  const tick = useSimulationStore((s) => s.tick);
  const { startSimulation, stopSimulation } = useSimulationActions();
  const {
    leftSidebarOpen, rightSidebarOpen, bottomPanelOpen,
    toggleLeftSidebar, toggleRightSidebar, toggleBottomPanel,
    setShowExportModal, setShowImportModal, setShowAnalysisModal, setShowChaosPanel,
    showChaosPanel, setShowInfraImport,
  } = useUIStore();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const data = getArchitectureData();
    try {
      if (projectId) {
        await apiFetch(`/api/architecture/${projectId}`, {
          method: 'PUT',
          body: JSON.stringify({ name: architectureName, ...data }),
        });
      } else {
        const res = await apiFetch('/api/architecture', {
          method: 'POST',
          body: JSON.stringify({ name: architectureName, ...data }),
        });
        if (res.ok) {
          const saved = await res.json();
          setProjectId(saved.id);
        }
      }
      markSaved();
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch { /* ignore */ }
    setSaving(false);
  }, [getArchitectureData, architectureName, projectId, setProjectId, markSaved]);

  return (
    <div className="h-11 border-b border-border bg-surface-800 flex items-center px-2 gap-1 flex-shrink-0">

      {/* ── Left: Sidebar toggle + Branding ── */}
      <button onClick={toggleLeftSidebar} className="p-1.5 hover:bg-surface-600 rounded transition-colors text-gray-400" title="Toggle component library">
        {leftSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
      </button>

      <div className="flex items-center gap-1.5 ml-1">
        <Activity size={14} className="text-accent-cyan" />
        <span className="text-xs font-semibold text-accent-cyan tracking-wide hidden sm:inline">SystemTwin</span>
        <span className="text-gray-600 hidden sm:inline">/</span>
        {isEditing ? (
          <input
            className="bg-surface-700 border border-border rounded px-2 py-0.5 text-xs w-40 focus:outline-none focus:border-accent-blue"
            value={architectureName}
            onChange={(e) => setArchitectureName(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditing(false)}
            autoFocus
          />
        ) : (
          <span className="text-xs text-gray-300 cursor-pointer hover:text-white truncate max-w-[160px]" onClick={() => setIsEditing(true)}>
            {architectureName}
          </span>
        )}
        <span className="text-[10px] text-gray-600">{nodes.length} nodes</span>
      </div>

      <div className="flex-1" />

      {/* ── File actions (grouped) ── */}
      <div className="flex items-center bg-surface-700/50 rounded-lg px-1 py-0.5 gap-0.5">
        <button data-action="save" onClick={handleSave} disabled={saving || nodes.length === 0} className="p-1.5 hover:bg-surface-600 rounded transition-colors disabled:opacity-30" title="Save (Ctrl+S)">
          {justSaved ? <Check size={14} className="text-green-400" /> : <Save size={14} />}
        </button>
        <button onClick={onOpenSaved} className="p-1.5 hover:bg-surface-600 rounded transition-colors" title="My Architectures">
          <FolderOpen size={14} />
        </button>
        <div className="relative">
          <button onClick={() => setShowFileMenu(!showFileMenu)} className="p-1.5 hover:bg-surface-600 rounded transition-colors" title="More actions">
            <MoreHorizontal size={14} />
          </button>
          {showFileMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFileMenu(false)} />
              <div className="absolute right-0 top-8 z-50 bg-surface-800 border border-border rounded-lg shadow-xl py-1 w-44">
                <button onClick={() => { useUIStore.getState().setShowTemplateSelector(true); setShowFileMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-surface-700">
                  <LayoutTemplate size={12} /> Templates
                </button>
                <button onClick={() => { setShowImportModal(true); setShowFileMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-surface-700">
                  <Upload size={12} /> Import JSON
                </button>
                <button onClick={() => { setShowExportModal(true); setShowFileMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-surface-700">
                  <Download size={12} /> Export
                </button>
                <button onClick={() => { setShowInfraImport(true); setShowFileMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-300 hover:bg-surface-700">
                  <CloudDownload size={12} /> Cloud Import
                </button>
                <div className="border-t border-border my-1" />
                <button onClick={() => { clearCanvas(); setShowFileMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-surface-700">
                  <Trash2 size={12} /> Clear Canvas
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Simulation controls (grouped) ── */}
      <div className="flex items-center bg-surface-700/50 rounded-lg px-1 py-0.5 gap-0.5 ml-1">
        <button onClick={() => setShowChaosPanel(!showChaosPanel)} className={`p-1.5 rounded transition-colors ${showChaosPanel ? 'bg-red-500/20 text-red-400' : 'hover:bg-surface-600 text-gray-400'}`} title="Chaos Engineering">
          <Zap size={14} />
        </button>
        <button onClick={() => useUIStore.getState().setShowSimConfig(true)} className="p-1.5 hover:bg-surface-600 rounded transition-colors text-gray-400" title="Configure Simulation">
          <Settings2 size={14} />
        </button>

        {simStatus === 'running' ? (
          <button onClick={stopSimulation} className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded text-[11px] font-medium ml-0.5">
            <Square size={10} /> Stop ({tick}s)
          </button>
        ) : (
          <button onClick={startSimulation} disabled={nodes.length === 0} className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-2.5 py-1 rounded text-[11px] font-medium ml-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
            <Play size={10} /> Run
          </button>
        )}

        {simStatus === 'completed' && (
          <button onClick={() => setShowAnalysisModal(true)} className="flex items-center gap-1 bg-accent-purple hover:brightness-110 text-white px-2.5 py-1 rounded text-[11px] font-medium">
            <BarChart3 size={10} /> Analyze
          </button>
        )}
      </div>

      {/* ── Right: Collab + Panels + Theme + User ── */}
      <div className="flex items-center gap-0.5 ml-1">
        {isCollaborating && (
          <div className="flex items-center gap-1 px-1.5 py-1 bg-accent-blue/10 rounded text-[10px] text-accent-blue mr-1" title="Active collaborators">
            <Users size={11} />
            <span>{collaborators.size + 1}</span>
          </div>
        )}

        <button onClick={toggleBottomPanel} className="p-1.5 hover:bg-surface-600 rounded transition-colors text-gray-400" title="Observability panel">
          {bottomPanelOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button onClick={toggleRightSidebar} className="p-1.5 hover:bg-surface-600 rounded transition-colors text-gray-400" title="Config panel">
          {rightSidebarOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
        </button>
        <button onClick={toggleTheme} className="p-1.5 hover:bg-surface-600 rounded transition-colors text-gray-400" title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <div className="w-px h-5 bg-border mx-0.5" />
        <UserMenu onOpenSaved={onOpenSaved} />
      </div>
    </div>
  );
}

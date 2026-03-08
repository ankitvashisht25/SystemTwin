import { useEffect } from 'react';
import { useArchitectureStore } from '../stores/architectureStore';
import { useUIStore } from '../stores/uiStore';
import { undo, redo, pushToFuture, pushToPast, canUndo, canRedo } from '../lib/undoRedo';

export function useKeyboardShortcuts() {
  const loadArchitecture = useArchitectureStore((s) => s.loadArchitecture);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;

      // Ignore shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Ctrl+Z - Undo
      if (isMod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          const { nodes, edges } = useArchitectureStore.getState();
          pushToFuture(nodes, edges);
          const snapshot = undo();
          if (snapshot) loadArchitecture(snapshot.nodes, snapshot.edges);
        }
      }

      // Ctrl+Shift+Z or Ctrl+Y - Redo
      if (isMod && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        if (canRedo()) {
          const { nodes, edges } = useArchitectureStore.getState();
          pushToPast(nodes, edges);
          const snapshot = redo();
          if (snapshot) loadArchitecture(snapshot.nodes, snapshot.edges);
        }
      }

      // Ctrl+S - Save (prevent default browser save)
      if (isMod && e.key === 's') {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>('[data-action="save"]')?.click();
      }

      // Ctrl+E - Toggle export modal
      if (isMod && e.key === 'e') {
        e.preventDefault();
        const { showExportModal, setShowExportModal } = useUIStore.getState();
        setShowExportModal(!showExportModal);
      }

      // Escape - Close modals / deselect
      if (e.key === 'Escape') {
        const ui = useUIStore.getState();
        if (ui.showExportModal) {
          ui.setShowExportModal(false);
          return;
        }
        if (ui.showImportModal) {
          ui.setShowImportModal(false);
          return;
        }
        if (ui.showTemplateSelector) {
          ui.setShowTemplateSelector(false);
          return;
        }
        if (ui.showAnalysisModal) {
          ui.setShowAnalysisModal(false);
          return;
        }
        if (ui.showSettings) {
          ui.setShowSettings(false);
          return;
        }
        useArchitectureStore.getState().setSelectedNode(null);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loadArchitecture]);
}

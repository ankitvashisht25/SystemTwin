import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ProjectState {
  projectId: string | null;
  projectName: string;
  architectureName: string;
  isSaved: boolean;
  lastSavedAt: string | null;
  setProjectId: (id: string | null) => void;
  setProjectName: (name: string) => void;
  setArchitectureName: (name: string) => void;
  markSaved: () => void;
  markUnsaved: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projectId: null,
      projectName: 'SystemTwin',
      architectureName: 'Untitled Architecture',
      isSaved: false,
      lastSavedAt: null,

      setProjectId: (id) => set({ projectId: id }),
      setProjectName: (name) => set({ projectName: name }),
      setArchitectureName: (name) => set({ architectureName: name }),
      markSaved: () => set({ isSaved: true, lastSavedAt: new Date().toISOString() }),
      markUnsaved: () => set({ isSaved: false }),
    }),
    {
      name: 'systemtwin-project',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        projectId: state.projectId,
        architectureName: state.architectureName,
      }),
    }
  )
);

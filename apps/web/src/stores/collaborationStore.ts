import { create } from 'zustand';

interface CollaboratorCursor {
  socketId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
  lastUpdate: number;
}

interface CollaborationState {
  isCollaborating: boolean;
  collaborators: Map<string, CollaboratorCursor>;
  setCollaborating: (v: boolean) => void;
  updateCursor: (socketId: string, data: { userName: string; x: number; y: number }) => void;
  removeCollaborator: (socketId: string) => void;
  clearAll: () => void;
}

const CURSOR_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  isCollaborating: false,
  collaborators: new Map(),

  setCollaborating: (v) => set({ isCollaborating: v }),

  updateCursor: (socketId, data) => {
    const collaborators = new Map(get().collaborators);
    const existing = collaborators.get(socketId);
    collaborators.set(socketId, {
      socketId,
      userName: data.userName,
      color: existing?.color || CURSOR_COLORS[collaborators.size % CURSOR_COLORS.length],
      x: data.x,
      y: data.y,
      lastUpdate: Date.now(),
    });
    set({ collaborators });
  },

  removeCollaborator: (socketId) => {
    const collaborators = new Map(get().collaborators);
    collaborators.delete(socketId);
    set({ collaborators });
  },

  clearAll: () => set({ collaborators: new Map(), isCollaborating: false }),
}));

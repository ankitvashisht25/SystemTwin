import { useEffect, useCallback } from 'react';
import { socket } from '../lib/socket';
import { useCollaborationStore } from '../stores/collaborationStore';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';

export function useCollaboration() {
  const user = useAuthStore((s) => s.user);
  const projectId = useProjectStore((s) => s.projectId);
  const updateCursor = useCollaborationStore((s) => s.updateCursor);
  const removeCollaborator = useCollaborationStore((s) => s.removeCollaborator);
  const setCollaborating = useCollaborationStore((s) => s.setCollaborating);

  useEffect(() => {
    if (!projectId || !user) return;

    // Join room
    socket.emit('collab:join', { architectureId: projectId, user: { name: user.name, id: user.id } });
    setCollaborating(true);

    // Listen for other users
    socket.on('collab:cursor-update', (data: { socketId: string; userName: string; x: number; y: number }) => {
      updateCursor(data.socketId, data);
    });

    socket.on('collab:user-left', (data: { socketId: string }) => {
      removeCollaborator(data.socketId);
    });

    socket.on('collab:node-changed', (_data: { action: string; node?: unknown; nodeId?: string }) => {
      // Apply remote changes - simplified for now
      // In production, use CRDT/OT for conflict resolution
    });

    return () => {
      socket.emit('collab:leave');
      socket.off('collab:cursor-update');
      socket.off('collab:user-left');
      socket.off('collab:node-changed');
      setCollaborating(false);
      useCollaborationStore.getState().clearAll();
    };
  }, [projectId, user, updateCursor, removeCollaborator, setCollaborating]);

  const broadcastCursorMove = useCallback((x: number, y: number) => {
    if (!user) return;
    socket.emit('collab:cursor-move', { userName: user.name, x, y });
  }, [user]);

  return { broadcastCursorMove };
}

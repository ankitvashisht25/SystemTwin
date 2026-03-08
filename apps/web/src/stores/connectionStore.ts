import { create } from 'zustand';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

interface ConnectionState {
  status: ConnectionStatus;
  reconnectAttempt: number;
  lastConnectedAt: Date | null;
  setStatus: (status: ConnectionStatus) => void;
  setReconnectAttempt: (attempt: number) => void;
  markConnected: () => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  reconnectAttempt: 0,
  lastConnectedAt: null,
  setStatus: (status) => set({ status }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  markConnected: () => set({ status: 'connected', reconnectAttempt: 0, lastConnectedAt: new Date() }),
}));

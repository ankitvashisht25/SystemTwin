import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { apiFetch } from '../lib/api';
import { useSimulationStore } from '../stores/simulationStore';
import { useArchitectureStore } from '../stores/architectureStore';
import { useUIStore } from '../stores/uiStore';
import { useConnectionStore } from '../stores/connectionStore';
import type { SimulationTick, LogEntry, ActiveFailure } from '@systemtwin/shared';

/**
 * Call this ONCE at the Workspace level to set up the Socket.IO connection.
 * It manages the connection lifecycle and dispatches tick data to the store.
 */
export function useSimulationSocket() {
  const processTick = useSimulationStore((s) => s.processTick);
  const addLog = useSimulationStore((s) => s.addLog);
  const addFailure = useSimulationStore((s) => s.addFailure);
  const removeFailure = useSimulationStore((s) => s.removeFailure);
  const setStatus = useSimulationStore((s) => s.setStatus);
  const updateAllStatuses = useArchitectureStore((s) => s.updateAllStatuses);

  useEffect(() => {
    const connStore = useConnectionStore.getState();

    socket.connect();

    socket.on('connect', () => connStore.markConnected());
    socket.on('disconnect', () => connStore.setStatus('disconnected'));
    socket.on('reconnect_attempt', (attempt: number) => {
      connStore.setStatus('reconnecting');
      connStore.setReconnectAttempt(attempt);
    });
    socket.on('reconnect_failed', () => connStore.setStatus('error'));
    socket.on('connect_error', () => {
      if (!socket.active) connStore.setStatus('error');
    });

    socket.on('simulation:tick', (data: SimulationTick) => {
      processTick(data.tick, data.metrics, data.logs, data.edgeTraffic, data.globalStats);
      if (data.statusChanges.length > 0) {
        updateAllStatuses(data.statusChanges);
      }
    });

    socket.on('simulation:log', (log: LogEntry) => addLog(log));
    socket.on('simulation:failure-injected', (failure: ActiveFailure) => addFailure(failure));
    socket.on('simulation:failure-removed', ({ failureId }: { failureId: string }) => removeFailure(failureId));
    socket.on('simulation:stopped', () => setStatus('completed'));

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect_failed');
      socket.off('connect_error');
      socket.off('simulation:tick');
      socket.off('simulation:log');
      socket.off('simulation:failure-injected');
      socket.off('simulation:failure-removed');
      socket.off('simulation:stopped');
      socket.disconnect();
    };
  }, [processTick, addLog, addFailure, removeFailure, setStatus, updateAllStatuses]);
}

/**
 * Standalone action functions — safe to call from any component.
 * No socket setup, no useEffect, no cleanup side effects.
 */
export function useSimulationActions() {
  return {
    startSimulation: async () => {
      const archData = useArchitectureStore.getState().getArchitectureData();
      if (archData.nodes.length === 0) return;

      const { trafficLevel, trafficPattern, tickRate, duration } = useSimulationStore.getState();
      useSimulationStore.getState().reset();
      useSimulationStore.getState().setStatus('running');

      const { bottomPanelOpen, toggleBottomPanel } = useUIStore.getState();
      if (!bottomPanelOpen) toggleBottomPanel();

      await apiFetch('/api/simulation/start', {
        method: 'POST',
        body: JSON.stringify({
          architecture: {
            id: 'sim',
            name: 'Simulation',
            nodes: archData.nodes,
            edges: archData.edges,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          config: { trafficLevel, trafficPattern, tickRate, duration },
        }),
      });
    },

    stopSimulation: async () => {
      await apiFetch('/api/simulation/stop', { method: 'POST' });
      useSimulationStore.getState().setStatus('completed');
    },

    injectFailure: async (nodeId: string, type: string) => {
      await apiFetch('/api/simulation/inject-failure', {
        method: 'POST',
        body: JSON.stringify({ nodeId, type }),
      });
    },

    removeFailure: async (failureId: string) => {
      await apiFetch('/api/simulation/remove-failure', {
        method: 'POST',
        body: JSON.stringify({ failureId }),
      });
    },
  };
}

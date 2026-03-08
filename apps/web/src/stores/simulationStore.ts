import { create } from 'zustand';
import type { NodeMetrics, LogEntry, ActiveFailure, SimulationStatus, AnalysisReport, TrafficPattern, EdgeTraffic, GlobalStats } from '@systemtwin/shared';

interface SimulationState {
  status: SimulationStatus;
  tick: number;
  trafficLevel: number;
  trafficPattern: TrafficPattern;
  tickRate: number;
  duration: number;
  metricsHistory: Map<string, NodeMetrics[]>;
  edgeTraffic: EdgeTraffic[];
  globalStats: GlobalStats | null;
  logs: LogEntry[];
  failures: ActiveFailure[];
  analysisReport: AnalysisReport | null;
  setStatus: (status: SimulationStatus) => void;
  setTrafficLevel: (level: number) => void;
  setTrafficPattern: (pattern: TrafficPattern) => void;
  setTickRate: (rate: number) => void;
  setDuration: (d: number) => void;
  processTick: (tick: number, metrics: NodeMetrics[], logs: LogEntry[], edgeTraffic: EdgeTraffic[], globalStats: GlobalStats) => void;
  addLog: (log: LogEntry) => void;
  addFailure: (failure: ActiveFailure) => void;
  removeFailure: (failureId: string) => void;
  setAnalysisReport: (report: AnalysisReport | null) => void;
  reset: () => void;
}

const MAX_HISTORY = 60;

export const useSimulationStore = create<SimulationState>((set, get) => ({
  status: 'idle',
  tick: 0,
  trafficLevel: 100,
  trafficPattern: 'steady',
  tickRate: 1000,
  duration: 300,
  metricsHistory: new Map(),
  edgeTraffic: [],
  globalStats: null,
  logs: [],
  failures: [],
  analysisReport: null,

  setStatus: (status) => set({ status }),
  setTrafficLevel: (level) => set({ trafficLevel: level }),
  setTrafficPattern: (pattern) => set({ trafficPattern: pattern }),
  setTickRate: (rate) => set({ tickRate: rate }),
  setDuration: (d) => set({ duration: d }),

  processTick: (tick, metrics, logs, edgeTraffic, globalStats) => {
    const history = new Map(get().metricsHistory);
    for (const m of metrics) {
      const nodeHistory = history.get(m.nodeId) || [];
      nodeHistory.push(m);
      if (nodeHistory.length > MAX_HISTORY) nodeHistory.shift();
      history.set(m.nodeId, nodeHistory);
    }
    set({
      tick,
      metricsHistory: history,
      edgeTraffic,
      globalStats,
      logs: [...get().logs, ...logs].slice(-500),
    });
  },

  addLog: (log) => set({ logs: [...get().logs, log].slice(-500) }),
  addFailure: (failure) => set({ failures: [...get().failures, failure] }),
  removeFailure: (failureId) => set({ failures: get().failures.filter((f) => f.id !== failureId) }),
  setAnalysisReport: (report) => set({ analysisReport: report }),

  reset: () => set({
    status: 'idle', tick: 0,
    metricsHistory: new Map(), edgeTraffic: [], globalStats: null,
    logs: [], failures: [], analysisReport: null,
  }),
}));

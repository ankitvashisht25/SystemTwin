import type { NodeStatus } from './architecture.js';

export type FailureType = 'crash' | 'latency' | 'partition' | 'resource-exhaustion';

export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed';

export type TrafficPattern = 'steady' | 'ramp' | 'spike' | 'wave';

export interface NodeMetrics {
  nodeId: string;
  cpu: number;
  memory: number;
  latency: number;
  errorRate: number;
  throughput: number;
  connections: number;
  queueDepth: number;
  timestamp: number;
}

export interface EdgeTraffic {
  source: string;
  target: string;
  requestsPerSec: number;
  avgLatency: number;
  errorRate: number;
}

export interface SimulationTick {
  tick: number;
  timestamp: number;
  metrics: NodeMetrics[];
  edgeTraffic: EdgeTraffic[];
  statusChanges: Array<{ nodeId: string; status: NodeStatus }>;
  logs: LogEntry[];
  globalStats: GlobalStats;
}

export interface GlobalStats {
  totalRequests: number;
  totalErrors: number;
  avgLatency: number;
  p99Latency: number;
  activeConnections: number;
  healthyNodes: number;
  degradedNodes: number;
  failedNodes: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  nodeId: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

export interface ActiveFailure {
  id: string;
  nodeId: string;
  type: FailureType;
  startedAt: number;
}

export interface SimulationConfig {
  trafficLevel: number;
  duration: number;
  trafficPattern: TrafficPattern;
  tickRate: number;
}

export interface AnalysisReport {
  summary: string;
  rootCause: string;
  cascadingEffects: string[];
  recommendations: string[];
  timeline: Array<{ time: number; event: string }>;
}

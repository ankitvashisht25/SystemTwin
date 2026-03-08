export interface SLADefinition {
  id: string;
  nodeId: string;
  metric: 'latency' | 'errorRate' | 'throughput' | 'cpu' | 'memory';
  operator: 'lt' | 'gt' | 'lte' | 'gte';
  threshold: number;
  windowTicks: number;
  name: string;
}

export interface SLAViolation {
  id: string;
  slaId: string;
  nodeId: string;
  metric: string;
  threshold: number;
  actualValue: number;
  tick: number;
  timestamp: number;
}

export type SLAStatus = 'met' | 'at_risk' | 'violated';

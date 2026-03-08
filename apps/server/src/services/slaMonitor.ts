import type { Server } from 'socket.io';
import type { NodeMetrics } from '@systemtwin/shared';
import type { SLADefinition, SLAViolation } from '@systemtwin/shared';
import { v4 as uuid } from 'uuid';

export class SLAMonitor {
  private io: Server;
  private definitions: SLADefinition[] = [];
  private metricsHistory: Map<string, number[]> = new Map();
  private violations: SLAViolation[] = [];

  constructor(io: Server) {
    this.io = io;
  }

  setDefinitions(definitions: SLADefinition[]) {
    this.definitions = definitions;
    this.metricsHistory.clear();
    this.violations = [];
  }

  evaluate(tick: number, metrics: NodeMetrics[]) {
    for (const metric of metrics) {
      for (const def of this.definitions) {
        if (def.nodeId !== metric.nodeId) continue;

        const key = `${def.id}-${def.nodeId}`;
        const history = this.metricsHistory.get(key) || [];
        const value = this.getMetricValue(metric, def.metric);
        history.push(value);
        if (history.length > def.windowTicks) history.shift();
        this.metricsHistory.set(key, history);

        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        const violated = this.checkThreshold(avg, def.operator, def.threshold);

        if (violated) {
          const violation: SLAViolation = {
            id: uuid(), slaId: def.id, nodeId: def.nodeId,
            metric: def.metric, threshold: def.threshold,
            actualValue: Math.round(avg * 100) / 100,
            tick, timestamp: Date.now(),
          };
          this.violations.push(violation);
          this.io.emit('simulation:sla-violation', violation);
        }
      }
    }
  }

  getViolations(): SLAViolation[] {
    return this.violations;
  }

  reset() {
    this.metricsHistory.clear();
    this.violations = [];
  }

  private getMetricValue(metric: NodeMetrics, metricName: string): number {
    switch (metricName) {
      case 'cpu': return metric.cpu;
      case 'memory': return metric.memory;
      case 'latency': return metric.latency;
      case 'errorRate': return metric.errorRate;
      case 'throughput': return metric.throughput;
      default: return 0;
    }
  }

  private checkThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }
}

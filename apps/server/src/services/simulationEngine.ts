import type { Server } from 'socket.io';
import type { Architecture, ArchitectureNode, NodeStatus } from '@systemtwin/shared';
import type {
  SimulationConfig, SimulationTick, NodeMetrics, LogEntry,
  ActiveFailure, FailureType, SimulationStatus,
  EdgeTraffic, GlobalStats,
} from '@systemtwin/shared';
import { v4 as uuid } from 'uuid';

/* ─── Per-node internal state ─── */
interface NodeState {
  status: NodeStatus;
  metrics: NodeMetrics;
  failureTicks: number;
  recoveryTicks: number;
  circuitBreakerOpen: boolean;
  circuitBreakerCooldown: number;
  connectionPool: number;
  queueDepth: number;
  prevCpu: number;
  prevMemory: number;
  totalRequests: number;
  totalErrors: number;
  latencies: number[];
}

/* ─── Realistic log templates ─── */
const logTemplates = {
  healthCheck: [
    'Health check passed — all endpoints responding',
    'Liveness probe OK, readiness probe OK',
    'Health check: response_time={lat}ms, status=UP',
  ],
  highLoad: [
    'Thread pool utilization at {cpu}% — approaching saturation',
    'Connection pool usage: {conn}/{maxConn} active connections',
    'Request queue depth rising: {queue} pending requests',
    'GC pause detected: {lat}ms — consider increasing heap size',
    'Worker thread starvation detected, {queue} tasks waiting',
  ],
  degraded: [
    'Response time degraded: p99={lat}ms exceeds 500ms threshold',
    'Circuit breaker HALF-OPEN — testing upstream connectivity',
    'Retry storm detected: 3x normal retry rate to {dep}',
    'Connection timeout to {dep} after 5000ms — retrying (attempt 2/3)',
    'Upstream {dep} responding slowly — shedding load',
    'Rate limiter engaged: dropping {err}% of incoming requests',
  ],
  failed: [
    'FATAL: Service unreachable — all health checks failing',
    'Connection refused to {dep}:{port} — upstream is down',
    'Circuit breaker OPEN for {dep} — fast-failing requests',
    'CRITICAL: Error rate {err}% exceeds threshold (5%)',
    'Out of memory: container killed by OOM (used {mem}%)',
    'Panic: unrecoverable error in request handler pipeline',
    'Max retries exhausted for {dep} — circuit breaker tripped',
  ],
  recovery: [
    'Service recovering — first successful health check in {t}s',
    'Circuit breaker CLOSED for {dep} — connection restored',
    'Connection pool replenished: {conn} active connections',
    'Error rate falling: {err}% — returning to normal',
    'Recovery in progress — draining {queue} queued requests',
  ],
};

function pickTemplate(category: keyof typeof logTemplates): string {
  const templates = logTemplates[category];
  return templates[Math.floor(Math.random() * templates.length)];
}

function fillTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? key));
}

function ema(prev: number, next: number, alpha = 0.3): number {
  return prev * (1 - alpha) + next * alpha;
}

function gaussNoise(stddev = 1): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return stddev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* ═══════════════════════════════════════════════════════
   SIMULATION ENGINE
   ═══════════════════════════════════════════════════════ */
export class SimulationEngine {
  private io: Server;
  private status: SimulationStatus = 'idle';
  private tick = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private architecture: Architecture | null = null;
  private config: SimulationConfig = { trafficLevel: 100, duration: 300, trafficPattern: 'steady', tickRate: 1000 };
  private nodeStates: Map<string, NodeState> = new Map();
  private adjacency: Map<string, string[]> = new Map();
  private reverseAdj: Map<string, string[]> = new Map();
  private failures: ActiveFailure[] = [];
  private allMetrics: NodeMetrics[][] = [];
  private allLogs: LogEntry[] = [];
  private globalTotalRequests = 0;
  private globalTotalErrors = 0;

  constructor(io: Server) {
    this.io = io;
  }

  start(architecture: Architecture, config?: Partial<SimulationConfig>) {
    if (this.status === 'running') this.stop();

    this.architecture = architecture;
    this.config = {
      trafficLevel: config?.trafficLevel ?? 100,
      duration: config?.duration ?? 300,
      trafficPattern: config?.trafficPattern ?? 'steady',
      tickRate: config?.tickRate ?? 1000,
    };
    this.tick = 0;
    this.failures = [];
    this.allMetrics = [];
    this.allLogs = [];
    this.globalTotalRequests = 0;
    this.globalTotalErrors = 0;

    this.buildGraph(architecture);
    this.initNodeStates(architecture);

    this.status = 'running';
    this.interval = setInterval(() => this.processTick(), this.config.tickRate);

    this.log('INFO', 'system',
      `Simulation started: ${this.config.trafficLevel} users, pattern=${this.config.trafficPattern}, nodes=${architecture.nodes.length}`
    );
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.status = 'completed';
    this.log('INFO', 'system',
      `Simulation completed: ${this.tick} ticks, ${this.globalTotalRequests} total requests, ${this.globalTotalErrors} errors`
    );
    this.io.emit('simulation:stopped');
  }

  injectFailure(nodeId: string, type: FailureType) {
    const failure: ActiveFailure = { id: uuid(), nodeId, type, startedAt: this.tick };
    this.failures.push(failure);

    const node = this.architecture?.nodes.find((n) => n.id === nodeId);
    const name = node?.label || nodeId;

    const messages: Record<FailureType, string> = {
      'crash': `CRITICAL: ${name} process killed (SIGKILL) — service down`,
      'latency': `WARN: Injecting 500ms network latency to ${name}`,
      'partition': `CRITICAL: Network partition — ${name} isolated from cluster`,
      'resource-exhaustion': `CRITICAL: ${name} CPU/Memory throttled — resource limits exceeded`,
    };

    this.log(type === 'latency' ? 'WARN' : 'ERROR', nodeId, messages[type]);
    this.io.emit('simulation:failure-injected', failure);
  }

  removeFailure(failureId: string) {
    const failure = this.failures.find((f) => f.id === failureId);
    if (failure) {
      const node = this.architecture?.nodes.find((n) => n.id === failure.nodeId);
      this.log('INFO', failure.nodeId, `Failure removed: ${failure.type} on ${node?.label || failure.nodeId} — beginning recovery`);
      const state = this.nodeStates.get(failure.nodeId);
      if (state) state.recoveryTicks = 5;
    }
    this.failures = this.failures.filter((f) => f.id !== failureId);
    this.io.emit('simulation:failure-removed', { failureId });
  }

  getStatus() {
    return {
      status: this.status, tick: this.tick, failures: this.failures,
      nodeStates: Object.fromEntries(
        Array.from(this.nodeStates.entries()).map(([id, s]) => [id, { status: s.status, metrics: s.metrics }])
      ),
    };
  }

  getCollectedData() {
    return { metrics: this.allMetrics, logs: this.allLogs, failures: this.failures };
  }

  private buildGraph(arch: Architecture) {
    this.adjacency.clear();
    this.reverseAdj.clear();
    for (const node of arch.nodes) {
      this.adjacency.set(node.id, []);
      this.reverseAdj.set(node.id, []);
    }
    for (const edge of arch.edges) {
      this.adjacency.get(edge.source)?.push(edge.target);
      this.reverseAdj.get(edge.target)?.push(edge.source);
    }
  }

  private initNodeStates(arch: Architecture) {
    this.nodeStates.clear();
    for (const node of arch.nodes) {
      const baseCpu = 8 + Math.random() * 12;
      const baseMem = 15 + Math.random() * 20;
      this.nodeStates.set(node.id, {
        status: 'healthy',
        metrics: {
          nodeId: node.id, cpu: baseCpu, memory: baseMem,
          latency: 5 + Math.random() * 10, errorRate: 0, throughput: 0,
          connections: 0, queueDepth: 0, timestamp: Date.now(),
        },
        failureTicks: 0, recoveryTicks: 0,
        circuitBreakerOpen: false, circuitBreakerCooldown: 0,
        connectionPool: 0, queueDepth: 0,
        prevCpu: baseCpu, prevMemory: baseMem,
        totalRequests: 0, totalErrors: 0, latencies: [],
      });
    }
  }

  /* ─── Traffic pattern modulation ─── */
  private getCurrentTraffic(): number {
    const base = this.config.trafficLevel;
    const t = this.tick;

    switch (this.config.trafficPattern) {
      case 'ramp':
        return base * Math.min(1, 0.1 + (t / 30) * 0.9);
      case 'spike':
        return base * (t % 20 < 5 && t > 10 ? 3.0 : 1.0);
      case 'wave':
        return base * (1 + 0.5 * Math.sin(t * 0.15));
      case 'steady':
      default:
        return base * (1 + gaussNoise(0.05));
    }
  }

  /* ─── Main tick ─── */
  private processTick() {
    if (!this.architecture) return;
    this.tick++;

    const tickMetrics: NodeMetrics[] = [];
    const statusChanges: Array<{ nodeId: string; status: NodeStatus }> = [];
    const tickLogs: LogEntry[] = [];
    const edgeTraffic: EdgeTraffic[] = [];

    const currentTraffic = this.getCurrentTraffic();
    const traffic = this.distributeTraffic(currentTraffic);

    for (const node of this.architecture.nodes) {
      const state = this.nodeStates.get(node.id);
      if (!state) continue;

      const nodeTraffic = traffic.get(node.id) || 0;
      const nodeFailures = this.failures.filter((f) => f.nodeId === node.id);
      const hasCrash = nodeFailures.some((f) => f.type === 'crash');
      const hasLatency = nodeFailures.some((f) => f.type === 'latency');
      const hasPartition = nodeFailures.some((f) => f.type === 'partition');
      const hasResourceExhaustion = nodeFailures.some((f) => f.type === 'resource-exhaustion');

      const downstreamHealth = this.checkDownstreamHealth(node.id);
      const upstreamDegradation = this.checkUpstreamDegradation(node.id);

      // Circuit breaker logic
      if (downstreamHealth === 'failed' && !state.circuitBreakerOpen) {
        state.circuitBreakerOpen = true;
        state.circuitBreakerCooldown = 10;
        const depName = this.getFailedDownstreamName(node.id);
        tickLogs.push(this.createLog('WARN', node.id,
          fillTemplate(pickTemplate('degraded'), { dep: depName, err: '0', lat: '0', port: '5432' })
        ));
      } else if (state.circuitBreakerOpen) {
        state.circuitBreakerCooldown--;
        if (state.circuitBreakerCooldown <= 0 && downstreamHealth !== 'failed') {
          state.circuitBreakerOpen = false;
          tickLogs.push(this.createLog('INFO', node.id,
            fillTemplate(pickTemplate('recovery'), { dep: this.getFirstDownstreamName(node.id), conn: String(state.connectionPool), err: '0', t: String(this.tick), queue: '0' })
          ));
        }
      }

      // Status determination
      let newStatus: NodeStatus = 'healthy';
      if (hasCrash || hasPartition) {
        newStatus = 'failed';
        state.failureTicks++;
      } else if (hasResourceExhaustion) {
        newStatus = state.failureTicks > 2 ? 'failed' : 'degraded';
        state.failureTicks++;
      } else if (state.recoveryTicks > 0) {
        newStatus = state.recoveryTicks > 3 ? 'degraded' : 'healthy';
        state.recoveryTicks--;
        if (state.recoveryTicks === 0) {
          tickLogs.push(this.createLog('INFO', node.id, `Service fully recovered — status healthy`));
        }
      } else if (upstreamDegradation === 'failed') {
        state.failureTicks++;
        newStatus = state.failureTicks > 4 ? 'failed' : state.failureTicks > 2 ? 'degraded' : 'healthy';
      } else if (upstreamDegradation === 'degraded' || hasLatency || state.circuitBreakerOpen) {
        newStatus = 'degraded';
      } else {
        state.failureTicks = Math.max(0, state.failureTicks - 1);
      }

      if (state.status !== newStatus) {
        statusChanges.push({ nodeId: node.id, status: newStatus });
        const depName = this.getFirstDownstreamName(node.id);
        if (newStatus === 'failed') {
          tickLogs.push(this.createLog('ERROR', node.id,
            fillTemplate(pickTemplate('failed'), { dep: depName, port: '5432', err: String(Math.round(state.metrics.errorRate)), mem: String(Math.round(state.metrics.memory)) })
          ));
        } else if (newStatus === 'degraded' && state.status === 'healthy') {
          tickLogs.push(this.createLog('WARN', node.id,
            fillTemplate(pickTemplate('degraded'), { dep: depName, lat: String(Math.round(state.metrics.latency)), err: String(Math.round(state.metrics.errorRate)), port: '5432' })
          ));
        } else if (newStatus === 'healthy' && state.status !== 'healthy') {
          tickLogs.push(this.createLog('INFO', node.id,
            fillTemplate(pickTemplate('recovery'), { dep: depName, conn: String(state.connectionPool), err: '0', t: String(this.tick), queue: String(state.queueDepth) })
          ));
        }
      }

      state.status = newStatus;

      // Compute metrics
      const capacity = this.getNodeCapacity(node);
      const load = Math.max(0, nodeTraffic / capacity);
      const metrics = this.computeMetrics(node, state, load, nodeFailures, hasLatency);

      const tickRequests = Math.max(0, Math.round(metrics.throughput));
      const tickErrors = Math.round(tickRequests * (metrics.errorRate / 100));
      state.totalRequests += tickRequests;
      state.totalErrors += tickErrors;
      this.globalTotalRequests += tickRequests;
      this.globalTotalErrors += tickErrors;
      state.latencies.push(metrics.latency);
      if (state.latencies.length > 60) state.latencies.shift();

      state.metrics = metrics;
      tickMetrics.push(metrics);

      // Periodic logs
      if (this.tick % 5 === 0 && newStatus === 'healthy' && nodeTraffic > 0) {
        tickLogs.push(this.createLog('INFO', node.id,
          fillTemplate(pickTemplate('healthCheck'), { lat: String(Math.round(metrics.latency)) })
        ));
      }
      if (load > 0.7 && newStatus === 'healthy') {
        tickLogs.push(this.createLog('WARN', node.id,
          fillTemplate(pickTemplate('highLoad'), {
            cpu: String(Math.round(metrics.cpu)), conn: String(Math.round(metrics.connections)),
            maxConn: String(Math.round(capacity / 10)), queue: String(Math.round(metrics.queueDepth)), lat: String(Math.round(metrics.latency)),
          })
        ));
      }
    }

    // Edge traffic
    for (const edge of this.architecture.edges) {
      const sourceState = this.nodeStates.get(edge.source);
      const targetState = this.nodeStates.get(edge.target);
      if (!sourceState || !targetState) continue;
      const sourceTraffic = traffic.get(edge.source) || 0;
      const downstreamCount = (this.adjacency.get(edge.source) || []).length;
      const edgeRps = sourceState.status === 'failed' ? 0 : sourceTraffic / Math.max(downstreamCount, 1);
      edgeTraffic.push({
        source: edge.source, target: edge.target,
        requestsPerSec: Math.max(0, edgeRps + gaussNoise(edgeRps * 0.05)),
        avgLatency: targetState.metrics.latency,
        errorRate: targetState.metrics.errorRate,
      });
    }

    // Global stats
    const allLatencies = tickMetrics.map((m) => m.latency).sort((a, b) => a - b);
    const states = Array.from(this.nodeStates.values());
    const globalStats: GlobalStats = {
      totalRequests: this.globalTotalRequests,
      totalErrors: this.globalTotalErrors,
      avgLatency: allLatencies.length > 0 ? allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length : 0,
      p99Latency: allLatencies.length > 0 ? allLatencies[Math.floor(allLatencies.length * 0.99)] : 0,
      activeConnections: states.reduce((s, n) => s + n.connectionPool, 0),
      healthyNodes: states.filter((s) => s.status === 'healthy').length,
      degradedNodes: states.filter((s) => s.status === 'degraded').length,
      failedNodes: states.filter((s) => s.status === 'failed').length,
    };

    this.allMetrics.push(tickMetrics);
    for (const log of tickLogs) this.allLogs.push(log);

    const tickData: SimulationTick = {
      tick: this.tick, timestamp: Date.now(),
      metrics: tickMetrics, edgeTraffic, statusChanges,
      logs: tickLogs, globalStats,
    };

    this.io.emit('simulation:tick', tickData);
    if (this.tick >= this.config.duration) this.stop();
  }

  private distributeTraffic(currentTraffic: number): Map<string, number> {
    const traffic = new Map<string, number>();
    if (!this.architecture) return traffic;

    const entryNodes = this.architecture.nodes.filter((n) => {
      const incoming = this.reverseAdj.get(n.id);
      return !incoming || incoming.length === 0;
    });
    const trafficPerEntry = currentTraffic / Math.max(entryNodes.length, 1);
    const queue: Array<{ nodeId: string; traffic: number }> = entryNodes.map((n) => ({ nodeId: n.id, traffic: trafficPerEntry }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { nodeId, traffic: t } = queue.shift()!;
      if (visited.has(nodeId)) { traffic.set(nodeId, (traffic.get(nodeId) || 0) + t); continue; }
      visited.add(nodeId);
      const state = this.nodeStates.get(nodeId);
      const effectiveTraffic = state?.status === 'failed' ? t * 0.1 : t;
      traffic.set(nodeId, (traffic.get(nodeId) || 0) + effectiveTraffic);

      const downstream = this.adjacency.get(nodeId) || [];
      const activeDownstream = downstream.filter((d) => {
        const dState = this.nodeStates.get(d);
        return !(state?.circuitBreakerOpen && dState?.status === 'failed');
      });
      const perChild = (state?.status === 'failed' ? 0 : effectiveTraffic) / Math.max(activeDownstream.length, 1);
      for (const child of activeDownstream) queue.push({ nodeId: child, traffic: perChild });
    }
    return traffic;
  }

  private checkDownstreamHealth(nodeId: string): NodeStatus | null {
    const downstream = this.adjacency.get(nodeId) || [];
    for (const dId of downstream) { const s = this.nodeStates.get(dId); if (s?.status === 'failed') return 'failed'; }
    for (const dId of downstream) { const s = this.nodeStates.get(dId); if (s?.status === 'degraded') return 'degraded'; }
    return 'healthy';
  }

  private checkUpstreamDegradation(nodeId: string): NodeStatus | null {
    const upstream = this.reverseAdj.get(nodeId) || [];
    let worst: NodeStatus | null = null;
    for (const upId of upstream) {
      const state = this.nodeStates.get(upId);
      if (!state) continue;
      if (this.failures.some((f) => f.type === 'partition' && (f.nodeId === upId || f.nodeId === nodeId))) return 'failed';
      if (state.status === 'failed') return 'failed';
      if (state.status === 'degraded') worst = 'degraded';
    }
    return worst;
  }

  private getFailedDownstreamName(nodeId: string): string {
    const downstream = this.adjacency.get(nodeId) || [];
    for (const dId of downstream) {
      if (this.nodeStates.get(dId)?.status === 'failed') return this.architecture?.nodes.find((n) => n.id === dId)?.label || dId;
    }
    return 'unknown';
  }

  private getFirstDownstreamName(nodeId: string): string {
    const downstream = this.adjacency.get(nodeId) || [];
    return downstream.length > 0 ? (this.architecture?.nodes.find((n) => n.id === downstream[0])?.label || downstream[0]) : 'N/A';
  }

  private getNodeCapacity(node: ArchitectureNode): number {
    const replicas = (node.config.replicas as number) || 1;
    const base: Record<string, number> = {
      'load-balancer': 5000, 'api-gateway': 3000, 'web-app': 2000, 'api-service': 1000,
      'auth-service': 800, 'worker-service': 500, 'gateway': 2000, 'mobile-api': 1500, 'cdn': 10000,
      'postgresql': 500, 'mysql': 500, 'mongodb': 800, 'redis': 5000, 'memcached': 5000,
      'kafka': 3000, 'rabbitmq': 2000, 'sqs': 3000, 'message-broker': 2000,
      'static-site': 3000, 'graphql-server': 1000, 'grpc-service': 1500, 'cron-scheduler': 200,
      'notification-service': 800, 'elasticsearch': 600, 'dynamodb': 2000, 'cassandra': 1000,
      'varnish': 8000, 'nats': 5000, 'sns': 3000, 'dns': 10000, 'waf': 8000,
      'service-mesh': 5000, 'object-storage': 3000,
      // AWS
      'aws-ec2': 2000, 'aws-lambda': 1000, 'aws-s3': 5000, 'aws-rds': 500,
      'aws-dynamodb': 2000, 'aws-ecs': 1500, 'aws-eks': 3000, 'aws-sqs': 3000,
      'aws-sns': 3000, 'aws-cloudfront': 10000, 'aws-route53': 10000,
      'aws-cognito': 2000, 'aws-api-gateway': 5000,
      // Azure
      'azure-vm': 2000, 'azure-functions': 1000, 'azure-blob': 5000, 'azure-sql': 500,
      'azure-cosmos': 1000, 'azure-aks': 3000, 'azure-service-bus': 2000,
      'azure-cdn': 10000, 'azure-ad': 2000, 'azure-api-mgmt': 5000,
      // GCP
      'gcp-compute': 2000, 'gcp-cloud-functions': 1000, 'gcp-cloud-storage': 5000,
      'gcp-cloud-sql': 500, 'gcp-firestore': 1000, 'gcp-gke': 3000,
      'gcp-pubsub': 3000, 'gcp-cloud-cdn': 10000, 'gcp-iam': 2000, 'gcp-api-gateway': 5000,
    };
    return (base[node.type] || 1000) * replicas;
  }

  private computeMetrics(node: ArchitectureNode, state: NodeState, load: number, failures: ActiveFailure[], hasLatency: boolean): NodeMetrics {
    const hasCrash = failures.some((f) => f.type === 'crash');
    const hasPartition = failures.some((f) => f.type === 'partition');
    const hasResourceExhaustion = failures.some((f) => f.type === 'resource-exhaustion');
    const capacity = this.getNodeCapacity(node);

    if (hasCrash || hasPartition) {
      state.connectionPool = 0; state.queueDepth = 0;
      return { nodeId: node.id, cpu: 0, memory: hasCrash ? 0 : state.prevMemory * 0.3, latency: 0, errorRate: 100, throughput: 0, connections: 0, queueDepth: 0, timestamp: Date.now() };
    }

    const sigmoid = (x: number, k: number, mid: number) => 1 / (1 + Math.exp(-k * (x - mid)));
    const recoveryFactor = state.recoveryTicks > 0 ? 0.5 + (5 - state.recoveryTicks) * 0.1 : 1;
    const effectiveLoad = load * recoveryFactor;

    let cpu: number, memory: number, latency: number, errorRate: number, throughput: number, connections: number, queueDepth: number;

    if (hasResourceExhaustion) {
      cpu = 92 + gaussNoise(3); memory = 88 + gaussNoise(4); latency = 1500 + Math.random() * 2000;
      errorRate = 20 + sigmoid(state.failureTicks, 0.5, 5) * 60; throughput = capacity * 0.05 + gaussNoise(10);
      connections = capacity * 0.9; queueDepth = 500 + state.failureTicks * 100;
    } else {
      const cpuBase = 8 + sigmoid(effectiveLoad, 8, 0.6) * 80;
      cpu = ema(state.prevCpu, cpuBase + gaussNoise(2), 0.4);
      const memBase = 20 + effectiveLoad * 45 + (state.circuitBreakerOpen ? 15 : 0);
      memory = ema(state.prevMemory, memBase + gaussNoise(1.5), 0.2);

      const baseLatency = node.category === 'cache' ? 2 : node.category === 'database' ? 8 : 15;
      const loadLatency = baseLatency * (1 + Math.pow(effectiveLoad, 2.5) * 10);
      const downstreamLat = this.getMaxDownstreamLatency(node.id);
      latency = Math.max(1, loadLatency + (state.circuitBreakerOpen ? 200 : 0) + (hasLatency ? 500 : 0) + downstreamLat * 0.3 + gaussNoise(loadLatency * 0.1));

      const baseErr = effectiveLoad > 0.8 ? Math.pow((effectiveLoad - 0.8) * 5, 2) * 20 : 0;
      errorRate = Math.min(100, Math.max(0, baseErr + (state.circuitBreakerOpen ? 8 : 0) + gaussNoise(0.5)));

      const maxTp = capacity * (1 - errorRate / 100);
      throughput = Math.max(0, effectiveLoad * maxTp * (effectiveLoad > 1 ? 1 / effectiveLoad : 1) + gaussNoise(maxTp * 0.02));
      connections = Math.max(0, Math.round(effectiveLoad * capacity * 0.3 + gaussNoise(5)));
      queueDepth = effectiveLoad > 0.7 ? Math.round((effectiveLoad - 0.7) * capacity * 0.5 + gaussNoise(3)) : 0;
    }

    state.prevCpu = cpu; state.prevMemory = memory;
    state.connectionPool = Math.max(0, Math.round(connections));
    state.queueDepth = Math.max(0, Math.round(queueDepth));

    return {
      nodeId: node.id, cpu: Math.max(0, Math.min(100, cpu)), memory: Math.max(0, Math.min(100, memory)),
      latency: Math.max(0, latency), errorRate: Math.max(0, Math.min(100, errorRate)), throughput: Math.max(0, throughput),
      connections: state.connectionPool, queueDepth: state.queueDepth, timestamp: Date.now(),
    };
  }

  private getMaxDownstreamLatency(nodeId: string): number {
    const downstream = this.adjacency.get(nodeId) || [];
    let max = 0;
    for (const dId of downstream) { const s = this.nodeStates.get(dId); if (s && s.metrics.latency > max) max = s.metrics.latency; }
    return max;
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR', nodeId: string, message: string) {
    const entry: LogEntry = { id: uuid(), timestamp: Date.now(), nodeId, level, message };
    this.allLogs.push(entry);
    this.io.emit('simulation:log', entry);
  }

  private createLog(level: 'INFO' | 'WARN' | 'ERROR', nodeId: string, message: string): LogEntry {
    return { id: uuid(), timestamp: Date.now(), nodeId, level, message };
  }
}

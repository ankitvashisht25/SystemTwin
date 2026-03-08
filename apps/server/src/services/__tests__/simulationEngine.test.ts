import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimulationEngine } from '../simulationEngine.js';
import type { Architecture } from '@systemtwin/shared';

function createMockIO() {
  return {
    emit: vi.fn(),
    on: vi.fn(),
  } as any;
}

function createTestArchitecture(): Architecture {
  return {
    id: 'test-arch',
    name: 'Test Architecture',
    nodes: [
      {
        id: 'api-1',
        type: 'api-service',
        category: 'backend',
        label: 'API Service',
        position: { x: 0, y: 0 },
        config: { replicas: 2, cpu: '500m', memory: '512MB' },
        status: 'healthy',
      },
      {
        id: 'db-1',
        type: 'postgresql',
        category: 'database',
        label: 'PostgreSQL',
        position: { x: 200, y: 0 },
        config: { storage: '100GB', replication: 1 },
        status: 'healthy',
      },
    ],
    edges: [
      { id: 'edge-1', source: 'api-1', target: 'db-1' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('SimulationEngine', () => {
  let io: ReturnType<typeof createMockIO>;
  let engine: SimulationEngine;

  beforeEach(() => {
    io = createMockIO();
    engine = new SimulationEngine(io);
    vi.useFakeTimers();
  });

  it('should start in idle state', () => {
    const status = engine.getStatus();
    expect(status.status).toBe('idle');
    expect(status.tick).toBe(0);
  });

  it('should transition to running on start', () => {
    const arch = createTestArchitecture();
    engine.start(arch, { trafficLevel: 100, duration: 10, trafficPattern: 'steady', tickRate: 1000 });

    const status = engine.getStatus();
    expect(status.status).toBe('running');
  });

  it('should emit tick events', () => {
    const arch = createTestArchitecture();
    engine.start(arch, { trafficLevel: 100, duration: 10, trafficPattern: 'steady', tickRate: 100 });

    vi.advanceTimersByTime(100);

    const tickCalls = io.emit.mock.calls.filter(
      (call: [string, ...unknown[]]) => call[0] === 'simulation:tick'
    );
    expect(tickCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should stop and emit stopped event', () => {
    const arch = createTestArchitecture();
    engine.start(arch, { trafficLevel: 100, duration: 10, trafficPattern: 'steady', tickRate: 100 });
    engine.stop();

    const status = engine.getStatus();
    expect(status.status).toBe('completed');

    const stoppedCalls = io.emit.mock.calls.filter(
      (call: [string, ...unknown[]]) => call[0] === 'simulation:stopped'
    );
    expect(stoppedCalls.length).toBe(1);
  });

  it('should inject failure', () => {
    const arch = createTestArchitecture();
    engine.start(arch, { trafficLevel: 100, duration: 100, trafficPattern: 'steady', tickRate: 100 });
    engine.injectFailure('api-1', 'crash');

    const status = engine.getStatus();
    expect(status.failures).toHaveLength(1);
    expect(status.failures[0].nodeId).toBe('api-1');
    expect(status.failures[0].type).toBe('crash');
  });

  it('should remove failure', () => {
    const arch = createTestArchitecture();
    engine.start(arch, { trafficLevel: 100, duration: 100, trafficPattern: 'steady', tickRate: 100 });
    engine.injectFailure('api-1', 'latency');

    const failureId = engine.getStatus().failures[0].id;
    engine.removeFailure(failureId);

    expect(engine.getStatus().failures).toHaveLength(0);
  });

  it('should auto-stop when duration is reached', () => {
    const arch = createTestArchitecture();
    engine.start(arch, { trafficLevel: 100, duration: 3, trafficPattern: 'steady', tickRate: 100 });

    vi.advanceTimersByTime(400);

    expect(engine.getStatus().status).toBe('completed');
  });

  it('should collect metrics and logs', () => {
    const arch = createTestArchitecture();
    engine.start(arch, { trafficLevel: 100, duration: 50, trafficPattern: 'steady', tickRate: 100 });

    vi.advanceTimersByTime(300);

    const data = engine.getCollectedData();
    expect(data.metrics.length).toBeGreaterThan(0);
    expect(data.logs.length).toBeGreaterThan(0);
  });
});

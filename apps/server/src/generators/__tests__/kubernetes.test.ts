import { describe, it, expect } from 'vitest';
import { generateKubernetes } from '../kubernetes.js';
import type { Architecture } from '@systemtwin/shared';

const testArchitecture: Architecture = {
  id: 'test-1',
  name: 'Test K8s App',
  nodes: [
    {
      id: 'api-1',
      type: 'api-service',
      category: 'backend',
      label: 'API Service',
      position: { x: 0, y: 0 },
      config: { replicas: 2, cpu: '500m', memory: '512MB', autoscaling: true },
      status: 'healthy',
    },
    {
      id: 'redis-1',
      type: 'redis',
      category: 'cache',
      label: 'Redis',
      position: { x: 200, y: 0 },
      config: { memory: '2GB' },
      status: 'healthy',
    },
  ],
  edges: [{ id: 'e1', source: 'api-1', target: 'redis-1' }],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('generateKubernetes', () => {
  it('should generate Kubernetes YAML with document separators', () => {
    const output = generateKubernetes(testArchitecture);
    expect(output).toContain('apiVersion:');
    expect(output).toContain('kind: Deployment');
    expect(output).toContain('kind: Service');
    expect(output).toContain('---');
  });

  it('should include replicas from config', () => {
    const output = generateKubernetes(testArchitecture);
    expect(output).toContain('replicas: 2');
  });

  it('should include resource requests and limits', () => {
    const output = generateKubernetes(testArchitecture);
    expect(output).toContain('cpu:');
    expect(output).toContain('memory:');
  });

  it('should include managed-by label', () => {
    const output = generateKubernetes(testArchitecture);
    expect(output).toContain('managed-by: systemtwin');
  });

  it('should generate HPA when autoscaling is enabled', () => {
    const output = generateKubernetes(testArchitecture);
    expect(output).toContain('HorizontalPodAutoscaler');
  });
});

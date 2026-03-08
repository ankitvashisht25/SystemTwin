import { describe, it, expect } from 'vitest';
import { generateDockerCompose } from '../dockerCompose.js';
import type { Architecture } from '@systemtwin/shared';

const testArchitecture: Architecture = {
  id: 'test-1',
  name: 'Test App',
  nodes: [
    {
      id: 'api-service-1',
      type: 'api-service',
      category: 'backend',
      label: 'API Service',
      position: { x: 0, y: 0 },
      config: { replicas: 3, language: 'Node.js' },
      status: 'healthy',
    },
    {
      id: 'postgresql-1',
      type: 'postgresql',
      category: 'database',
      label: 'PostgreSQL',
      position: { x: 200, y: 0 },
      config: { storage: '100GB' },
      status: 'healthy',
    },
    {
      id: 'redis-1',
      type: 'redis',
      category: 'cache',
      label: 'Redis',
      position: { x: 200, y: 100 },
      config: { memory: '2GB', evictionPolicy: 'allkeys-lru' },
      status: 'healthy',
    },
  ],
  edges: [
    { id: 'e1', source: 'api-service-1', target: 'postgresql-1' },
    { id: 'e2', source: 'api-service-1', target: 'redis-1' },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('generateDockerCompose', () => {
  it('should generate valid docker-compose YAML', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('version: "3.8"');
    expect(output).toContain('services:');
    expect(output).toContain('networks:');
  });

  it('should map node types to correct images', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('image: node:20-alpine');
    expect(output).toContain('image: postgres:16-alpine');
    expect(output).toContain('image: redis:7-alpine');
  });

  it('should include replicas in deploy section', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('deploy:');
    expect(output).toContain('replicas: 3');
  });

  it('should include environment variables for databases', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('POSTGRES_DB=app');
    expect(output).toContain('POSTGRES_USER=postgres');
  });

  it('should include connection strings for downstream deps', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('DATABASE_URL=postgresql://');
    expect(output).toContain('REDIS_URL=redis://');
  });

  it('should include depends_on for edges', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('depends_on:');
  });

  it('should include volumes for database nodes', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('volumes:');
    expect(output).toContain('postgresql/data');
  });

  it('should place all services on systemtwin network', () => {
    const output = generateDockerCompose(testArchitecture);
    expect(output).toContain('systemtwin');
    expect(output).toContain('driver: bridge');
  });
});

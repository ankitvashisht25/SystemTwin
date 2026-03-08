import { describe, it, expect } from 'vitest';
import { generateTerraform } from '../terraform.js';
import type { Architecture } from '@systemtwin/shared';

const testArchitecture: Architecture = {
  id: 'test-1',
  name: 'Test TF App',
  nodes: [
    {
      id: 'api-1',
      type: 'api-service',
      category: 'backend',
      label: 'API Service',
      position: { x: 0, y: 0 },
      config: { replicas: 2, cpu: '1000m', memory: '1GB' },
      status: 'healthy',
    },
    {
      id: 'pg-1',
      type: 'postgresql',
      category: 'database',
      label: 'PostgreSQL',
      position: { x: 200, y: 0 },
      config: { storage: '100GB', backup: true },
      status: 'healthy',
    },
    {
      id: 'redis-1',
      type: 'redis',
      category: 'cache',
      label: 'Redis',
      position: { x: 200, y: 100 },
      config: { memory: '2GB' },
      status: 'healthy',
    },
  ],
  edges: [
    { id: 'e1', source: 'api-1', target: 'pg-1' },
    { id: 'e2', source: 'api-1', target: 'redis-1' },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('generateTerraform', () => {
  it('should generate HCL with provider block', () => {
    const output = generateTerraform(testArchitecture);
    expect(output).toContain('provider "aws"');
  });

  it('should generate VPC resource', () => {
    const output = generateTerraform(testArchitecture);
    expect(output).toContain('aws_vpc');
  });

  it('should generate ECS for backend services', () => {
    const output = generateTerraform(testArchitecture);
    expect(output).toContain('aws_ecs_service');
  });

  it('should generate RDS for PostgreSQL', () => {
    const output = generateTerraform(testArchitecture);
    expect(output).toContain('aws_db_instance');
    expect(output).toContain('postgres');
  });

  it('should generate ElastiCache for Redis', () => {
    const output = generateTerraform(testArchitecture);
    expect(output).toContain('aws_elasticache_cluster');
    expect(output).toContain('redis');
  });
});

import type { Architecture } from '@systemtwin/shared';

const imageMap: Record<string, string> = {
  'web-app': 'nginx:alpine',
  'mobile-api': 'node:20-alpine',
  'cdn': 'nginx:alpine',
  'api-service': 'node:20-alpine',
  'auth-service': 'node:20-alpine',
  'worker-service': 'python:3.12-slim',
  'gateway': 'kong:latest',
  'postgresql': 'postgres:16-alpine',
  'mysql': 'mysql:8',
  'mongodb': 'mongo:7',
  'redis': 'redis:7-alpine',
  'memcached': 'memcached:1.6-alpine',
  'kafka': 'confluentinc/cp-kafka:7.5.0',
  'rabbitmq': 'rabbitmq:3-management-alpine',
  'sqs': 'softwaremill/elasticmq:latest',
  'load-balancer': 'haproxy:2.9-alpine',
  'api-gateway': 'kong:latest',
  'message-broker': 'rabbitmq:3-management-alpine',
  'static-site': 'nginx:alpine',
  'graphql-server': 'node:20-alpine',
  'grpc-service': 'golang:1.22-alpine',
  'cron-scheduler': 'python:3.12-slim',
  'notification-service': 'node:20-alpine',
  'elasticsearch': 'elasticsearch:8.12.0',
  'dynamodb': 'amazon/dynamodb-local:latest',
  'cassandra': 'cassandra:4.1',
  'varnish': 'varnish:7.4-alpine',
  'nats': 'nats:2.10-alpine',
  'sns': 'node:20-alpine',
  'dns': 'coredns/coredns:1.11',
  'waf': 'nginx:alpine',
  'service-mesh': 'istio/pilot:1.20',
  'object-storage': 'minio/minio:latest',
  // AWS
  'aws-ec2': 'amazonlinux:2023',
  'aws-lambda': 'public.ecr.aws/lambda/nodejs:20',
  'aws-s3': 'minio/minio:latest',
  'aws-rds': 'postgres:16-alpine',
  'aws-dynamodb': 'amazon/dynamodb-local:latest',
  'aws-ecs': 'node:20-alpine',
  'aws-eks': 'node:20-alpine',
  'aws-sqs': 'softwaremill/elasticmq:latest',
  'aws-sns': 'node:20-alpine',
  'aws-cloudfront': 'nginx:alpine',
  'aws-route53': 'coredns/coredns:1.11',
  'aws-cognito': 'node:20-alpine',
  'aws-api-gateway': 'kong:latest',
  // Azure
  'azure-vm': 'mcr.microsoft.com/cbl-mariner/base/core:2.0',
  'azure-functions': 'mcr.microsoft.com/azure-functions/node:4-node20',
  'azure-blob': 'mcr.microsoft.com/azure-storage/azurite:latest',
  'azure-sql': 'mcr.microsoft.com/mssql/server:2022-latest',
  'azure-cosmos': 'mcr.microsoft.com/cosmosdb/linux/azure-cosmos-emulator:latest',
  'azure-aks': 'node:20-alpine',
  'azure-service-bus': 'node:20-alpine',
  'azure-cdn': 'nginx:alpine',
  'azure-ad': 'node:20-alpine',
  'azure-api-mgmt': 'kong:latest',
  // GCP
  'gcp-compute': 'debian:12-slim',
  'gcp-cloud-functions': 'node:20-alpine',
  'gcp-cloud-storage': 'fsouza/fake-gcs-server:latest',
  'gcp-cloud-sql': 'postgres:16-alpine',
  'gcp-firestore': 'node:20-alpine',
  'gcp-gke': 'node:20-alpine',
  'gcp-pubsub': 'google/cloud-sdk:slim',
  'gcp-cloud-cdn': 'nginx:alpine',
  'gcp-iam': 'node:20-alpine',
  'gcp-api-gateway': 'kong:latest',
};

export function generateDockerCompose(architecture: Architecture): string {
  const lines: string[] = [];
  lines.push('version: "3.8"');
  lines.push('');
  lines.push('services:');

  for (const node of architecture.nodes) {
    const serviceName = node.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    const image = imageMap[node.type] || 'alpine:latest';
    const replicas = (node.config.replicas as number) || 1;

    lines.push(`  ${serviceName}:`);
    lines.push(`    image: ${image}`);
    lines.push(`    container_name: ${serviceName}`);

    if (replicas > 1) {
      lines.push(`    deploy:`);
      lines.push(`      replicas: ${replicas}`);
    }

    // Environment variables
    const env = getEnvVars(node.type, node.config, architecture, node.id);
    if (env.length > 0) {
      lines.push(`    environment:`);
      for (const e of env) {
        lines.push(`      - ${e}`);
      }
    }

    // Ports
    const port = getDefaultPort(node.type);
    if (port) {
      lines.push(`    ports:`);
      lines.push(`      - "${port}:${port}"`);
    }

    // Dependencies
    const deps = architecture.edges
      .filter((e) => e.source === node.id)
      .map((e) => e.target.replace(/[^a-z0-9-]/gi, '-').toLowerCase());
    if (deps.length > 0) {
      lines.push(`    depends_on:`);
      for (const dep of deps) {
        lines.push(`      - ${dep}`);
      }
    }

    // Volumes for databases
    if (['postgresql', 'mysql', 'mongodb', 'elasticsearch', 'cassandra'].includes(node.type)) {
      lines.push(`    volumes:`);
      lines.push(`      - ${serviceName}-data:/var/lib/${node.type === 'postgresql' ? 'postgresql/data' : node.type === 'mysql' ? 'mysql' : 'data/db'}`);
    }

    lines.push(`    networks:`);
    lines.push(`      - systemtwin`);
    lines.push('');
  }

  // Volumes
  const dbNodes = architecture.nodes.filter((n) => ['postgresql', 'mysql', 'mongodb', 'elasticsearch', 'cassandra'].includes(n.type));
  if (dbNodes.length > 0) {
    lines.push('volumes:');
    for (const node of dbNodes) {
      const name = node.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
      lines.push(`  ${name}-data:`);
    }
    lines.push('');
  }

  lines.push('networks:');
  lines.push('  systemtwin:');
  lines.push('    driver: bridge');

  return lines.join('\n');
}

function getDefaultPort(type: string): number | null {
  const ports: Record<string, number> = {
    'web-app': 80,
    'api-service': 3000,
    'auth-service': 3001,
    'gateway': 8000,
    'api-gateway': 8000,
    'postgresql': 5432,
    'mysql': 3306,
    'mongodb': 27017,
    'redis': 6379,
    'memcached': 11211,
    'kafka': 9092,
    'rabbitmq': 5672,
    'load-balancer': 80,
    'static-site': 80,
    'graphql-server': 4000,
    'grpc-service': 50051,
    'notification-service': 3002,
    'elasticsearch': 9200,
    'dynamodb': 8000,
    'cassandra': 9042,
    'varnish': 6081,
    'nats': 4222,
  };
  return ports[type] || null;
}

function getEnvVars(type: string, config: Record<string, unknown>, arch: Architecture, nodeId: string): string[] {
  const env: string[] = [];

  if (type === 'postgresql') {
    env.push('POSTGRES_DB=app');
    env.push('POSTGRES_USER=postgres');
    env.push('POSTGRES_PASSWORD=postgres');
  } else if (type === 'mysql') {
    env.push('MYSQL_DATABASE=app');
    env.push('MYSQL_ROOT_PASSWORD=mysql');
  } else if (type === 'redis') {
    const mem = config.memory as string || '2GB';
    env.push(`REDIS_MAXMEMORY=${mem.toLowerCase()}`);
    env.push(`REDIS_MAXMEMORY_POLICY=${config.evictionPolicy || 'allkeys-lru'}`);
  }

  // Add connection strings for downstream deps
  const downstream = arch.edges.filter((e) => e.source === nodeId);
  for (const edge of downstream) {
    const target = arch.nodes.find((n) => n.id === edge.target);
    if (!target) continue;
    const targetName = target.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    if (target.type === 'postgresql') {
      env.push(`DATABASE_URL=postgresql://postgres:postgres@${targetName}:5432/app`);
    } else if (target.type === 'redis') {
      env.push(`REDIS_URL=redis://${targetName}:6379`);
    } else if (target.type === 'mongodb') {
      env.push(`MONGODB_URI=mongodb://${targetName}:27017/app`);
    }
  }

  return env;
}

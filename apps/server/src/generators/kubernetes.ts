import type { Architecture, ArchitectureNode } from '@systemtwin/shared';

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
};

export function generateKubernetes(architecture: Architecture): string {
  const documents: string[] = [];

  for (const node of architecture.nodes) {
    documents.push(generateDeployment(node));
    documents.push(generateService(node));
  }

  return documents.join('\n---\n');
}

function generateDeployment(node: ArchitectureNode): string {
  const name = node.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const image = imageMap[node.type] || 'alpine:latest';
  const replicas = (node.config.replicas as number) || 1;
  const cpu = (node.config.cpu as string) || '500m';
  const memory = (node.config.memory as string) || '512Mi';
  const memoryK8s = memory.replace('MB', 'Mi').replace('GB', 'Gi');

  const lines = [
    `apiVersion: apps/v1`,
    `kind: Deployment`,
    `metadata:`,
    `  name: ${name}`,
    `  labels:`,
    `    app: ${name}`,
    `    managed-by: systemtwin`,
    `spec:`,
    `  replicas: ${replicas}`,
    `  selector:`,
    `    matchLabels:`,
    `      app: ${name}`,
    `  template:`,
    `    metadata:`,
    `      labels:`,
    `        app: ${name}`,
    `    spec:`,
    `      containers:`,
    `        - name: ${name}`,
    `          image: ${image}`,
    `          resources:`,
    `            requests:`,
    `              cpu: ${cpu}`,
    `              memory: ${memoryK8s}`,
    `            limits:`,
    `              cpu: ${cpu}`,
    `              memory: ${memoryK8s}`,
  ];

  const port = getPort(node.type);
  if (port) {
    lines.push(`          ports:`);
    lines.push(`            - containerPort: ${port}`);
  }

  if (node.config.autoscaling) {
    lines.push('');
    lines.push('---');
    lines.push(`apiVersion: autoscaling/v2`);
    lines.push(`kind: HorizontalPodAutoscaler`);
    lines.push(`metadata:`);
    lines.push(`  name: ${name}-hpa`);
    lines.push(`spec:`);
    lines.push(`  scaleTargetRef:`);
    lines.push(`    apiVersion: apps/v1`);
    lines.push(`    kind: Deployment`);
    lines.push(`    name: ${name}`);
    lines.push(`  minReplicas: ${replicas}`);
    lines.push(`  maxReplicas: ${replicas * 3}`);
    lines.push(`  metrics:`);
    lines.push(`    - type: Resource`);
    lines.push(`      resource:`);
    lines.push(`        name: cpu`);
    lines.push(`        target:`);
    lines.push(`          type: Utilization`);
    lines.push(`          averageUtilization: 70`);
  }

  return lines.join('\n');
}

function generateService(node: ArchitectureNode): string {
  const name = node.id.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const port = getPort(node.type);

  const lines = [
    `apiVersion: v1`,
    `kind: Service`,
    `metadata:`,
    `  name: ${name}`,
    `spec:`,
    `  selector:`,
    `    app: ${name}`,
    `  ports:`,
    `    - port: ${port || 80}`,
    `      targetPort: ${port || 80}`,
  ];

  if (['web-app', 'load-balancer', 'api-gateway'].includes(node.type)) {
    lines.push(`  type: LoadBalancer`);
  } else {
    lines.push(`  type: ClusterIP`);
  }

  return lines.join('\n');
}

function getPort(type: string): number | null {
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
  };
  return ports[type] || null;
}

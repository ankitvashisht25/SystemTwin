import type { Architecture, ArchitectureNode, ComponentType } from '@systemtwin/shared';
import type { CostEstimate, CostLineItem, ArchitectureCost, CostProjection } from '@systemtwin/shared';

// Approximate AWS monthly pricing
const awsPricing: Record<string, { service: string; basePrice: number; unit: string }> = {
  'web-app': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'mobile-api': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'cdn': { service: 'CloudFront', basePrice: 25.00, unit: 'per distribution/month' },
  'api-service': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'auth-service': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'worker-service': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'gateway': { service: 'API Gateway', basePrice: 35.00, unit: 'per million requests' },
  'postgresql': { service: 'RDS PostgreSQL', basePrice: 115.00, unit: 'db.t3.medium/month' },
  'mysql': { service: 'RDS MySQL', basePrice: 105.00, unit: 'db.t3.medium/month' },
  'mongodb': { service: 'DocumentDB', basePrice: 200.00, unit: 'db.r5.large/month' },
  'redis': { service: 'ElastiCache', basePrice: 50.00, unit: 'cache.t3.medium/month' },
  'memcached': { service: 'ElastiCache', basePrice: 45.00, unit: 'cache.t3.medium/month' },
  'kafka': { service: 'MSK', basePrice: 250.00, unit: 'per broker/month' },
  'rabbitmq': { service: 'Amazon MQ', basePrice: 80.00, unit: 'mq.m5.large/month' },
  'sqs': { service: 'SQS', basePrice: 4.00, unit: 'per million requests' },
  'load-balancer': { service: 'ALB', basePrice: 22.50, unit: 'per ALB/month' },
  'api-gateway': { service: 'API Gateway', basePrice: 35.00, unit: 'per million requests' },
  'message-broker': { service: 'Amazon MQ', basePrice: 80.00, unit: 'mq.m5.large/month' },
  'static-site': { service: 'S3 + CloudFront', basePrice: 15.00, unit: 'per site/month' },
  'graphql-server': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'grpc-service': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'cron-scheduler': { service: 'ECS Fargate', basePrice: 18.25, unit: 'per vCPU/month' },
  'notification-service': { service: 'ECS Fargate + SES', basePrice: 40.00, unit: 'per vCPU/month' },
  'elasticsearch': { service: 'OpenSearch', basePrice: 180.00, unit: 'r6g.large/month' },
  'dynamodb': { service: 'DynamoDB', basePrice: 25.00, unit: 'per 25 WCU/month' },
  'cassandra': { service: 'Keyspaces', basePrice: 300.00, unit: 'per node/month' },
  'varnish': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'nats': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'sns': { service: 'SNS', basePrice: 0.50, unit: 'per million publishes' },
  'dns': { service: 'Route 53', basePrice: 0.50, unit: 'per hosted zone/month' },
  'waf': { service: 'AWS WAF', basePrice: 5.00, unit: 'per web ACL/month' },
  'service-mesh': { service: 'App Mesh', basePrice: 0, unit: 'no additional charge' },
  'object-storage': { service: 'S3', basePrice: 23.00, unit: 'per TB/month' },
  // AWS
  'aws-ec2': { service: 'EC2', basePrice: 67.00, unit: 't3.medium/month' },
  'aws-lambda': { service: 'Lambda', basePrice: 5.00, unit: 'per 1M requests + compute' },
  'aws-s3': { service: 'S3', basePrice: 23.00, unit: 'per TB/month' },
  'aws-rds': { service: 'RDS', basePrice: 115.00, unit: 'db.t3.medium/month' },
  'aws-dynamodb': { service: 'DynamoDB', basePrice: 25.00, unit: 'per 25 WCU/month' },
  'aws-ecs': { service: 'ECS Fargate', basePrice: 36.50, unit: 'per vCPU/month' },
  'aws-eks': { service: 'EKS', basePrice: 73.00, unit: 'cluster + node/month' },
  'aws-sqs': { service: 'SQS', basePrice: 4.00, unit: 'per million requests' },
  'aws-sns': { service: 'SNS', basePrice: 0.50, unit: 'per million publishes' },
  'aws-cloudfront': { service: 'CloudFront', basePrice: 25.00, unit: 'per distribution/month' },
  'aws-route53': { service: 'Route 53', basePrice: 0.50, unit: 'per hosted zone/month' },
  'aws-cognito': { service: 'Cognito', basePrice: 5.50, unit: 'per 10K MAU' },
  'aws-api-gateway': { service: 'API Gateway', basePrice: 35.00, unit: 'per million requests' },
  // Azure
  'azure-vm': { service: 'Azure VM', basePrice: 70.00, unit: 'D2s_v3/month' },
  'azure-functions': { service: 'Azure Functions', basePrice: 4.00, unit: 'per 1M executions' },
  'azure-blob': { service: 'Azure Blob', basePrice: 20.00, unit: 'per TB/month' },
  'azure-sql': { service: 'Azure SQL', basePrice: 150.00, unit: 'Gen Purpose 2 vCore/month' },
  'azure-cosmos': { service: 'Cosmos DB', basePrice: 58.00, unit: 'per 400 RU/s/month' },
  'azure-aks': { service: 'AKS', basePrice: 73.00, unit: 'cluster + node/month' },
  'azure-service-bus': { service: 'Service Bus', basePrice: 10.00, unit: 'Standard/month' },
  'azure-cdn': { service: 'Azure CDN', basePrice: 17.00, unit: 'per profile/month' },
  'azure-ad': { service: 'Entra ID', basePrice: 6.00, unit: 'per user P1/month' },
  'azure-api-mgmt': { service: 'API Management', basePrice: 48.00, unit: 'Developer tier/month' },
  // GCP
  'gcp-compute': { service: 'Compute Engine', basePrice: 49.00, unit: 'e2-medium/month' },
  'gcp-cloud-functions': { service: 'Cloud Functions', basePrice: 4.00, unit: 'per 1M invocations' },
  'gcp-cloud-storage': { service: 'Cloud Storage', basePrice: 20.00, unit: 'per TB/month' },
  'gcp-cloud-sql': { service: 'Cloud SQL', basePrice: 105.00, unit: 'db-custom-2-8192/month' },
  'gcp-firestore': { service: 'Firestore', basePrice: 18.00, unit: 'per 100K reads/day' },
  'gcp-gke': { service: 'GKE', basePrice: 73.00, unit: 'cluster + node/month' },
  'gcp-pubsub': { service: 'Pub/Sub', basePrice: 4.00, unit: 'per TiB/month' },
  'gcp-cloud-cdn': { service: 'Cloud CDN', basePrice: 15.00, unit: 'per cache fill GB' },
  'gcp-iam': { service: 'IAM', basePrice: 0, unit: 'no additional charge' },
  'gcp-api-gateway': { service: 'API Gateway', basePrice: 30.00, unit: 'per million requests' },
};

function parseCpu(cpu: string): number {
  const val = parseInt(cpu.replace('m', ''));
  return isNaN(val) ? 500 : val;
}

function parseMemory(memory: string): number {
  const val = parseInt(memory);
  if (memory.includes('GB')) return val * 1024;
  if (memory.includes('MB')) return val;
  return 512;
}

function estimateNodeCost(node: ArchitectureNode): CostEstimate {
  const pricing = awsPricing[node.type] || { service: 'Unknown', basePrice: 50, unit: 'per unit/month' };
  const replicas = (node.config.replicas as number) || 1;
  const breakdown: CostLineItem[] = [];

  let totalCost = 0;

  if (['web-app', 'mobile-api', 'api-service', 'auth-service', 'worker-service', 'graphql-server', 'grpc-service', 'cron-scheduler', 'notification-service'].includes(node.type)) {
    const cpuMillis = parseCpu((node.config.cpu as string) || '500m');
    const memMB = parseMemory((node.config.memory as string) || '512MB');
    const cpuCost = (cpuMillis / 1000) * 36.50 * replicas;
    const memCost = (memMB / 1024) * 4.02 * replicas;
    breakdown.push({ resource: 'Compute (vCPU)', quantity: replicas, unitPrice: (cpuMillis / 1000) * 36.50, monthlyCost: cpuCost });
    breakdown.push({ resource: 'Memory (GB)', quantity: replicas, unitPrice: (memMB / 1024) * 4.02, monthlyCost: memCost });
    totalCost = cpuCost + memCost;
  } else if (['postgresql', 'mysql'].includes(node.type)) {
    const storageCost = parseStorageGB(node.config.storage as string) * 0.115;
    const instanceCost = pricing.basePrice * replicas;
    breakdown.push({ resource: 'Instance', quantity: replicas, unitPrice: pricing.basePrice, monthlyCost: instanceCost });
    breakdown.push({ resource: 'Storage', quantity: 1, unitPrice: storageCost, monthlyCost: storageCost });
    totalCost = instanceCost + storageCost;
  } else if (node.type === 'mongodb') {
    const instanceCost = pricing.basePrice;
    breakdown.push({ resource: 'Instance', quantity: 1, unitPrice: pricing.basePrice, monthlyCost: instanceCost });
    totalCost = instanceCost;
  } else if (['redis', 'memcached'].includes(node.type)) {
    const instanceCost = pricing.basePrice;
    breakdown.push({ resource: 'Cache Node', quantity: 1, unitPrice: pricing.basePrice, monthlyCost: instanceCost });
    totalCost = instanceCost;
  } else if (node.type === 'kafka') {
    const brokers = 3;
    const brokerCost = pricing.basePrice * brokers;
    breakdown.push({ resource: 'Brokers', quantity: brokers, unitPrice: pricing.basePrice, monthlyCost: brokerCost });
    totalCost = brokerCost;
  } else {
    breakdown.push({ resource: pricing.service, quantity: 1, unitPrice: pricing.basePrice, monthlyCost: pricing.basePrice });
    totalCost = pricing.basePrice;
  }

  return {
    nodeId: node.id,
    componentType: node.type,
    service: pricing.service,
    monthlyCost: Math.round(totalCost * 100) / 100,
    breakdown,
  };
}

function parseStorageGB(storage: string): number {
  const val = parseInt(storage);
  if (storage.includes('TB')) return val * 1000;
  return isNaN(val) ? 100 : val;
}

export function estimateArchitectureCost(architecture: Architecture): ArchitectureCost {
  const nodes = architecture.nodes.map(estimateNodeCost);
  const totalMonthlyCost = Math.round(nodes.reduce((sum, n) => sum + n.monthlyCost, 0) * 100) / 100;

  const projections: CostProjection[] = [1, 2, 5, 10].map((scale) => {
    const scaledCost = nodes.reduce((sum, n) => {
      const node = architecture.nodes.find((an) => an.id === n.nodeId)!;
      const isScalable = ['web-app', 'mobile-api', 'api-service', 'auth-service', 'worker-service', 'graphql-server', 'grpc-service', 'cron-scheduler', 'notification-service'].includes(node.type);
      return sum + (isScalable ? n.monthlyCost * scale : n.monthlyCost);
    }, 0);
    return { scale, label: `${scale}x`, monthlyCost: Math.round(scaledCost * 100) / 100 };
  });

  return { totalMonthlyCost, nodes, projections };
}

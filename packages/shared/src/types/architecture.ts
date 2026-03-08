export type NodeCategory = 'frontend' | 'backend' | 'database' | 'cache' | 'queue' | 'infrastructure' | 'aws' | 'azure' | 'gcp';

export type NodeStatus = 'healthy' | 'degraded' | 'failed' | 'offline';

export type ComponentType =
  | 'web-app' | 'mobile-api' | 'cdn' | 'static-site'
  | 'api-service' | 'auth-service' | 'worker-service' | 'gateway' | 'graphql-server' | 'grpc-service' | 'cron-scheduler' | 'notification-service'
  | 'postgresql' | 'mysql' | 'mongodb' | 'elasticsearch' | 'dynamodb' | 'cassandra'
  | 'redis' | 'memcached' | 'varnish'
  | 'kafka' | 'rabbitmq' | 'sqs' | 'nats' | 'sns'
  | 'load-balancer' | 'api-gateway' | 'message-broker' | 'dns' | 'waf' | 'service-mesh' | 'object-storage'
  | 'aws-ec2' | 'aws-lambda' | 'aws-s3' | 'aws-rds' | 'aws-dynamodb' | 'aws-ecs' | 'aws-eks' | 'aws-sqs' | 'aws-sns' | 'aws-cloudfront' | 'aws-route53' | 'aws-cognito' | 'aws-api-gateway'
  | 'azure-vm' | 'azure-functions' | 'azure-blob' | 'azure-sql' | 'azure-cosmos' | 'azure-aks' | 'azure-service-bus' | 'azure-cdn' | 'azure-ad' | 'azure-api-mgmt'
  | 'gcp-compute' | 'gcp-cloud-functions' | 'gcp-cloud-storage' | 'gcp-cloud-sql' | 'gcp-firestore' | 'gcp-gke' | 'gcp-pubsub' | 'gcp-cloud-cdn' | 'gcp-iam' | 'gcp-api-gateway';

export interface ArchitectureNode {
  id: string;
  type: ComponentType;
  category: NodeCategory;
  label: string;
  position: { x: number; y: number };
  config: Record<string, unknown>;
  status: NodeStatus;
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  protocol?: string;
}

export interface Architecture {
  id: string;
  name: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  createdAt: string;
  updatedAt: string;
}

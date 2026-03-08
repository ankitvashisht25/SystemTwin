import type { ArchitectureNode, ArchitectureEdge } from '@systemtwin/shared';
import { v4 as uuid } from 'uuid';

interface ImportConfig {
  provider: 'aws' | 'gcp' | 'azure';
  environment: 'production' | 'staging' | 'development';
  services: string[];
}

interface ImportResult {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  summary: { discovered: number; connections: number; services: string[]; provider: string; environment: string };
}

interface ServiceDefinition {
  type: string;
  category: string;
  labels: { aws: string; gcp: string; azure: string };
  config: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// All cloud services organized by the 20 canonical categories
// ---------------------------------------------------------------------------
export const servicesByCategory: Record<string, ServiceDefinition[]> = {
  /* 1 ─ Compute */
  compute: [
    { type: 'api-service', category: 'backend', labels: { aws: 'EC2 Instances', gcp: 'Compute Engine', azure: 'Virtual Machines' }, config: { replicas: 3, cpu: '2000m', memory: '4GB', autoscaling: true } },
    { type: 'worker-service', category: 'backend', labels: { aws: 'Lambda Functions', gcp: 'Cloud Functions', azure: 'Azure Functions' }, config: { replicas: 1, concurrency: 100 } },
    { type: 'api-service', category: 'backend', labels: { aws: 'ECS Service', gcp: 'Cloud Run', azure: 'Container Apps' }, config: { replicas: 3, cpu: '1000m', memory: '2GB', autoscaling: true } },
    { type: 'api-service', category: 'backend', labels: { aws: 'EKS Cluster', gcp: 'GKE Cluster', azure: 'AKS Cluster' }, config: { replicas: 3, cpu: '2000m', memory: '4GB', autoscaling: true } },
    { type: 'worker-service', category: 'backend', labels: { aws: 'Fargate Tasks', gcp: 'Cloud Run Jobs', azure: 'Container Instances' }, config: { replicas: 2, concurrency: 10 } },
  ],

  /* 2 ─ Storage */
  storage: [
    { type: 'object-storage', category: 'infrastructure', labels: { aws: 'S3 Bucket', gcp: 'Cloud Storage', azure: 'Blob Storage' }, config: { provider: 'S3', versioning: true, encryption: true, lifecycle: '90d' } },
    { type: 'object-storage', category: 'infrastructure', labels: { aws: 'EBS Volumes', gcp: 'Persistent Disk', azure: 'Managed Disks' }, config: { provider: 'S3', versioning: false, encryption: true, lifecycle: 'none' } },
    { type: 'object-storage', category: 'infrastructure', labels: { aws: 'EFS', gcp: 'Filestore', azure: 'Azure Files' }, config: { provider: 'S3', versioning: false, encryption: true, lifecycle: 'none' } },
  ],

  /* 3 ─ Databases */
  databases: [
    { type: 'postgresql', category: 'database', labels: { aws: 'RDS PostgreSQL', gcp: 'Cloud SQL', azure: 'Azure SQL Database' }, config: { storage: '100GB', replication: 1, backup: true, maxConnections: 200 } },
    { type: 'dynamodb', category: 'database', labels: { aws: 'DynamoDB', gcp: 'Firestore', azure: 'Cosmos DB' }, config: { readCapacity: 100, writeCapacity: 100, onDemand: true } },
    { type: 'postgresql', category: 'database', labels: { aws: 'Aurora', gcp: 'Cloud Spanner', azure: 'SQL Managed Instance' }, config: { storage: '500GB', replication: 2, backup: true, maxConnections: 500 } },
    { type: 'postgresql', category: 'database', labels: { aws: 'Redshift', gcp: 'BigQuery', azure: 'Synapse Analytics' }, config: { storage: '1TB', replication: 2, backup: true, maxConnections: 100 } },
    { type: 'redis', category: 'cache', labels: { aws: 'ElastiCache Redis', gcp: 'Memorystore', azure: 'Azure Redis Cache' }, config: { memory: '4GB', evictionPolicy: 'allkeys-lru', cluster: true } },
  ],

  /* 4 ─ Networking */
  networking: [
    { type: 'load-balancer', category: 'infrastructure', labels: { aws: 'Application Load Balancer', gcp: 'HTTP Load Balancer', azure: 'Azure Load Balancer' }, config: { algorithm: 'round-robin', healthCheckInterval: 15, maxConnections: 50000 } },
    { type: 'dns', category: 'infrastructure', labels: { aws: 'Route 53', gcp: 'Cloud DNS', azure: 'Azure DNS' }, config: { provider: 'Route53', routing: 'latency-based', healthCheck: true } },
    { type: 'cdn', category: 'frontend', labels: { aws: 'CloudFront', gcp: 'Cloud CDN', azure: 'Azure CDN' }, config: { provider: 'CloudFront', cachePolicy: '24h' } },
    { type: 'waf', category: 'infrastructure', labels: { aws: 'AWS WAF', gcp: 'Cloud Armor', azure: 'Azure WAF' }, config: { provider: 'AWS WAF', ruleGroups: 3, rateLimit: 5000, logging: true } },
    { type: 'gateway', category: 'infrastructure', labels: { aws: 'VPN Gateway', gcp: 'Cloud VPN', azure: 'VPN Gateway' }, config: { tunnels: 2, encryption: 'AES-256', highAvailability: true } },
  ],

  /* 5 ─ Containers */
  containers: [
    { type: 'object-storage', category: 'infrastructure', labels: { aws: 'ECR Registry', gcp: 'Artifact Registry', azure: 'Container Registry' }, config: { provider: 'S3', versioning: true, encryption: true, lifecycle: '90d' } },
    { type: 'service-mesh', category: 'infrastructure', labels: { aws: 'App Mesh', gcp: 'Anthos Service Mesh', azure: 'Service Fabric' }, config: { provider: 'Istio', mtls: true, tracing: true } },
    { type: 'api-service', category: 'backend', labels: { aws: 'App Runner', gcp: 'Cloud Run (managed)', azure: 'Container Apps (serverless)' }, config: { replicas: 2, cpu: '1000m', memory: '2GB', autoscaling: true } },
  ],

  /* 6 ─ DevOps (CI/CD) */
  devops: [
    { type: 'api-service', category: 'backend', labels: { aws: 'CodeBuild', gcp: 'Cloud Build', azure: 'Azure Pipelines' }, config: { replicas: 2, cpu: '1000m', memory: '2GB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'CodeDeploy', gcp: 'Cloud Deploy', azure: 'Azure Release Pipelines' }, config: { replicas: 1, cpu: '500m', memory: '512MB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'CodePipeline', gcp: 'Cloud Build Triggers', azure: 'Azure DevOps Pipelines' }, config: { replicas: 1, cpu: '500m', memory: '512MB', autoscaling: false } },
  ],

  /* 7 ─ Messaging */
  messaging: [
    { type: 'sqs', category: 'queue', labels: { aws: 'SQS Queue', gcp: 'Pub/Sub', azure: 'Service Bus' }, config: { type: 'Standard', visibilityTimeout: 30, retentionPeriod: '4d' } },
    { type: 'sns', category: 'queue', labels: { aws: 'SNS Topic', gcp: 'Eventarc', azure: 'Event Grid' }, config: { type: 'Standard', protocol: 'HTTPS' } },
    { type: 'kafka', category: 'queue', labels: { aws: 'EventBridge', gcp: 'Eventarc Triggers', azure: 'Event Hub' }, config: { partitions: 12, replicationFactor: 3, retentionPeriod: '7d' } },
    { type: 'worker-service', category: 'backend', labels: { aws: 'Step Functions', gcp: 'Workflows', azure: 'Logic Apps' }, config: { replicas: 1, concurrency: 50 } },
  ],

  /* 8 ─ Security */
  security: [
    { type: 'auth-service', category: 'backend', labels: { aws: 'IAM / Cognito', gcp: 'Cloud IAM / Identity Platform', azure: 'Azure AD / B2C' }, config: { provider: 'OAuth2', replicas: 2, sessionTTL: '24h' } },
    { type: 'api-service', category: 'backend', labels: { aws: 'Secrets Manager', gcp: 'Secret Manager', azure: 'Key Vault' }, config: { replicas: 2, cpu: '250m', memory: '256MB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'KMS', gcp: 'Cloud KMS', azure: 'Azure Key Vault (Encryption)' }, config: { replicas: 2, cpu: '250m', memory: '256MB', autoscaling: false } },
    { type: 'waf', category: 'infrastructure', labels: { aws: 'AWS WAF (Security)', gcp: 'Cloud Armor (Security)', azure: 'Azure WAF (Security)' }, config: { provider: 'AWS WAF', ruleGroups: 4, rateLimit: 8000, logging: true } },
    { type: 'waf', category: 'infrastructure', labels: { aws: 'GuardDuty / Shield', gcp: 'Security Command Center', azure: 'Defender for Cloud' }, config: { provider: 'AWS WAF', ruleGroups: 5, rateLimit: 10000, logging: true } },
  ],

  /* 9 ─ Observability */
  observability: [
    { type: 'api-service', category: 'backend', labels: { aws: 'CloudWatch', gcp: 'Cloud Monitoring', azure: 'Azure Monitor' }, config: { replicas: 2, cpu: '500m', memory: '1GB', autoscaling: false } },
    { type: 'elasticsearch', category: 'database', labels: { aws: 'CloudWatch Logs', gcp: 'Cloud Logging', azure: 'Log Analytics' }, config: { storage: '500GB', nodes: 3, shards: 5, replicas: 1 } },
    { type: 'api-service', category: 'backend', labels: { aws: 'X-Ray', gcp: 'Cloud Trace', azure: 'Application Insights' }, config: { replicas: 2, cpu: '500m', memory: '512MB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'CloudTrail', gcp: 'Audit Logs', azure: 'Activity Log' }, config: { replicas: 1, cpu: '250m', memory: '256MB', autoscaling: false } },
  ],

  /* 10 ─ Data Engineering */
  data_engineering: [
    { type: 'kafka', category: 'queue', labels: { aws: 'Kinesis', gcp: 'Pub/Sub Streaming', azure: 'Event Hubs' }, config: { partitions: 24, replicationFactor: 3, retentionPeriod: '7d' } },
    { type: 'worker-service', category: 'backend', labels: { aws: 'Glue ETL', gcp: 'Dataflow', azure: 'Data Factory' }, config: { replicas: 2, concurrency: 10 } },
    { type: 'worker-service', category: 'backend', labels: { aws: 'EMR Cluster', gcp: 'Dataproc', azure: 'HDInsight' }, config: { replicas: 3, concurrency: 20 } },
    { type: 'postgresql', category: 'database', labels: { aws: 'Athena', gcp: 'BigQuery (Analytics)', azure: 'Synapse Serverless' }, config: { storage: '1TB', replication: 1, backup: true, maxConnections: 100 } },
  ],

  /* 11 ─ AI / ML */
  ai_ml: [
    { type: 'api-service', category: 'backend', labels: { aws: 'SageMaker', gcp: 'Vertex AI', azure: 'Azure ML' }, config: { replicas: 2, cpu: '2000m', memory: '4GB', autoscaling: true } },
    { type: 'api-service', category: 'backend', labels: { aws: 'Rekognition / Comprehend', gcp: 'Vision AI / NLP API', azure: 'Computer Vision / Text Analytics' }, config: { replicas: 1, cpu: '1000m', memory: '2GB', autoscaling: true } },
  ],

  /* 12 ─ API */
  api: [
    { type: 'api-gateway', category: 'infrastructure', labels: { aws: 'API Gateway', gcp: 'API Gateway', azure: 'API Management' }, config: { rateLimit: 10000, authentication: true, logging: true } },
    { type: 'graphql-server', category: 'backend', labels: { aws: 'AppSync', gcp: 'API Gateway + Cloud Endpoints', azure: 'Logic Apps (GraphQL)' }, config: { replicas: 2, cpu: '500m', memory: '512MB', autoscaling: true } },
  ],

  /* 13 ─ Hybrid / Edge */
  hybrid: [
    { type: 'api-service', category: 'backend', labels: { aws: 'Outposts', gcp: 'Anthos (Hybrid)', azure: 'Azure Arc' }, config: { replicas: 2, cpu: '2000m', memory: '4GB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'Wavelength', gcp: 'Distributed Cloud Edge', azure: 'Azure Edge Zones' }, config: { replicas: 1, cpu: '1000m', memory: '2GB', autoscaling: false } },
  ],

  /* 14 ─ Migration */
  migration: [
    { type: 'worker-service', category: 'backend', labels: { aws: 'DMS (Database Migration)', gcp: 'Database Migration Service', azure: 'Azure Database Migration' }, config: { replicas: 1, concurrency: 5 } },
    { type: 'worker-service', category: 'backend', labels: { aws: 'Application Migration Service', gcp: 'Migrate for Compute Engine', azure: 'Azure Migrate' }, config: { replicas: 1, concurrency: 5 } },
  ],

  /* 15 ─ Developer */
  developer: [
    { type: 'web-app', category: 'frontend', labels: { aws: 'Amplify', gcp: 'Firebase', azure: 'Static Web Apps' }, config: { framework: 'React', replicas: 2, cdn: true } },
    { type: 'api-service', category: 'backend', labels: { aws: 'Device Farm', gcp: 'Firebase Test Lab', azure: 'App Center' }, config: { replicas: 1, cpu: '500m', memory: '512MB', autoscaling: false } },
  ],

  /* 16 ─ Cost Management */
  cost_management: [
    { type: 'api-service', category: 'backend', labels: { aws: 'Cost Explorer', gcp: 'Billing Reports', azure: 'Cost Management' }, config: { replicas: 1, cpu: '250m', memory: '256MB', autoscaling: false } },
  ],

  /* 17 ─ Analytics */
  analytics: [
    { type: 'api-service', category: 'backend', labels: { aws: 'QuickSight', gcp: 'Looker', azure: 'Power BI' }, config: { replicas: 1, cpu: '1000m', memory: '2GB', autoscaling: false } },
    { type: 'elasticsearch', category: 'database', labels: { aws: 'OpenSearch', gcp: 'Elastic Cloud', azure: 'Azure Search' }, config: { storage: '100GB', nodes: 3, shards: 5, replicas: 1 } },
  ],

  /* 18 ─ IaC */
  iac: [
    { type: 'api-service', category: 'backend', labels: { aws: 'CloudFormation', gcp: 'Deployment Manager', azure: 'ARM Templates' }, config: { replicas: 1, cpu: '500m', memory: '512MB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'CDK', gcp: 'Terraform (GCP)', azure: 'Bicep' }, config: { replicas: 1, cpu: '500m', memory: '512MB', autoscaling: false } },
  ],

  /* 19 ─ CDN & Security (Global) */
  cdn_security: [
    { type: 'load-balancer', category: 'infrastructure', labels: { aws: 'Global Accelerator', gcp: 'Global HTTP LB', azure: 'Azure Front Door' }, config: { algorithm: 'geo-proximity', healthCheckInterval: 10, maxConnections: 100000 } },
    { type: 'waf', category: 'infrastructure', labels: { aws: 'Shield Advanced', gcp: 'Cloud Armor (Global)', azure: 'Azure DDoS Protection' }, config: { provider: 'AWS WAF', ruleGroups: 5, rateLimit: 20000, logging: true } },
  ],

  /* 20 ─ DevOps Tools (self-hosted / managed) */
  devops_tools: [
    { type: 'api-service', category: 'backend', labels: { aws: 'Jenkins / GitHub Actions', gcp: 'Cloud Build', azure: 'Azure DevOps' }, config: { replicas: 2, cpu: '1000m', memory: '2GB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'Prometheus', gcp: 'Managed Prometheus', azure: 'Prometheus (self-hosted)' }, config: { replicas: 2, cpu: '500m', memory: '1GB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'Grafana', gcp: 'Grafana Cloud', azure: 'Grafana (Managed)' }, config: { replicas: 1, cpu: '500m', memory: '512MB', autoscaling: false } },
    { type: 'service-mesh', category: 'infrastructure', labels: { aws: 'Istio / Envoy', gcp: 'Anthos Service Mesh', azure: 'Consul Connect' }, config: { provider: 'Istio', mtls: true, tracing: true } },
    { type: 'api-service', category: 'backend', labels: { aws: 'Vault (Secrets)', gcp: 'Secret Manager', azure: 'Key Vault' }, config: { replicas: 2, cpu: '250m', memory: '256MB', autoscaling: false } },
    { type: 'api-service', category: 'backend', labels: { aws: 'ArgoCD', gcp: 'Config Sync', azure: 'Flux' }, config: { replicas: 1, cpu: '500m', memory: '512MB', autoscaling: false } },
  ],
};

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------
const COLUMN_WIDTH = 220;
const ROW_HEIGHT = 140;

function layoutPosition(index: number, columnCount: number, xBase: number, yBase: number) {
  const col = index % columnCount;
  const row = Math.floor(index / columnCount);
  return { x: xBase + col * COLUMN_WIDTH, y: yBase + row * ROW_HEIGHT };
}

// ---------------------------------------------------------------------------
// Edge-generation helpers
// ---------------------------------------------------------------------------
function edgeId(): string {
  return `edge-${uuid().slice(0, 8)}`;
}

function connect(source: string, target: string): ArchitectureEdge {
  return { id: edgeId(), source, target };
}

function generateEdges(nodes: ArchitectureNode[]): ArchitectureEdge[] {
  const edges: ArchitectureEdge[] = [];
  const seen = new Set<string>();

  const addOnce = (src: string, tgt: string) => {
    const key = `${src}:${tgt}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(connect(src, tgt));
  };

  // Collect nodes by role
  const lbs        = nodes.filter(n => n.type === 'load-balancer');
  const wafs       = nodes.filter(n => n.type === 'waf');
  const cdns       = nodes.filter(n => n.type === 'cdn');
  const dnss       = nodes.filter(n => n.type === 'dns');
  const gateways   = nodes.filter(n => n.type === 'api-gateway' || n.type === 'gateway');
  const backends   = nodes.filter(n => n.category === 'backend' && n.type === 'api-service');
  const workers    = nodes.filter(n => n.type === 'worker-service');
  const databases  = nodes.filter(n => n.category === 'database');
  const caches     = nodes.filter(n => n.category === 'cache');
  const queues     = nodes.filter(n => n.category === 'queue');
  const auth       = nodes.filter(n => n.type === 'auth-service');
  const graphql    = nodes.filter(n => n.type === 'graphql-server');
  const meshes     = nodes.filter(n => n.type === 'service-mesh');
  const webApps    = nodes.filter(n => n.type === 'web-app' || n.type === 'static-site');
  const search     = nodes.filter(n => n.type === 'elasticsearch');
  const storage    = nodes.filter(n => n.type === 'object-storage');
  const observ     = nodes.filter(n => n.category === 'backend' && (
    n.label.includes('CloudWatch') || n.label.includes('Monitor') ||
    n.label.includes('X-Ray') || n.label.includes('Trace') || n.label.includes('Insights') ||
    n.label.includes('Prometheus') || n.label.includes('Grafana') ||
    n.label.includes('CloudTrail') || n.label.includes('Audit') || n.label.includes('Activity')
  ));

  // WAF -> LB
  for (const w of wafs) for (const lb of lbs) addOnce(w.id, lb.id);

  // DNS -> CDN
  for (const d of dnss) for (const c of cdns) addOnce(d.id, c.id);

  // DNS -> LB (if no CDN present)
  if (cdns.length === 0) for (const d of dnss) for (const lb of lbs) addOnce(d.id, lb.id);

  // CDN -> LB
  for (const c of cdns) for (const lb of lbs) addOnce(c.id, lb.id);

  // CDN -> Web Apps
  for (const c of cdns) for (const w of webApps) addOnce(c.id, w.id);

  // LB -> API backends (limit fan-out to first 4)
  for (const lb of lbs) for (const be of backends.slice(0, 4)) addOnce(lb.id, be.id);

  // API Gateway -> backends
  for (const gw of gateways) for (const be of backends.slice(0, 3)) addOnce(gw.id, be.id);

  // API Gateway -> GraphQL
  for (const gw of gateways) for (const g of graphql) addOnce(gw.id, g.id);

  // GraphQL -> backends
  for (const g of graphql) for (const be of backends.slice(0, 2)) addOnce(g.id, be.id);

  // Backends -> databases
  for (const be of backends.slice(0, 3)) for (const db of databases) addOnce(be.id, db.id);

  // Backends -> caches
  for (const be of backends.slice(0, 3)) for (const c of caches) addOnce(be.id, c.id);

  // Backends -> queues (first backend sends to queues)
  for (const be of backends.slice(0, 1)) for (const q of queues) addOnce(be.id, q.id);

  // Queues -> workers
  for (const q of queues) for (const w of workers) addOnce(q.id, w.id);

  // Workers -> databases
  for (const w of workers) for (const db of databases) addOnce(w.id, db.id);

  // Workers -> storage
  for (const w of workers) for (const s of storage) addOnce(w.id, s.id);

  // Backends -> storage
  for (const be of backends.slice(0, 2)) for (const s of storage) addOnce(be.id, s.id);

  // Auth -> backends
  for (const a of auth) for (const be of backends.slice(0, 3)) addOnce(a.id, be.id);

  // Service mesh -> backends
  for (const m of meshes) for (const be of backends.slice(0, 3)) addOnce(m.id, be.id);

  // Observability -> backends (monitoring targets)
  for (const o of observ) for (const be of backends.slice(0, 2)) addOnce(o.id, be.id);

  // Backends -> search / elasticsearch
  for (const be of backends.slice(0, 2)) for (const s of search) addOnce(be.id, s.id);

  return edges;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export function importInfrastructure(config: ImportConfig): ImportResult {
  const allNodes: ArchitectureNode[] = [];
  const serviceNames: string[] = [];

  let yBase = 0;

  for (const categoryId of config.services) {
    const definitions = servicesByCategory[categoryId];
    if (!definitions || definitions.length === 0) continue;
    serviceNames.push(categoryId);

    definitions.forEach((def, idx) => {
      const nodeId = `import-${categoryId}-${uuid().slice(0, 8)}`;
      const label = def.labels[config.provider];
      const position = layoutPosition(idx, 3, 100, yBase);

      // Deep-clone config so mutations don't leak
      const nodeConfig: Record<string, unknown> = { ...def.config };

      allNodes.push({
        id: nodeId,
        type: def.type as ArchitectureNode['type'],
        category: def.category as ArchitectureNode['category'],
        label,
        position,
        config: nodeConfig,
        status: 'healthy',
      });
    });

    yBase += Math.ceil(definitions.length / 3) * ROW_HEIGHT + 40;
  }

  // Scale replicas by environment
  const replicaScale = config.environment === 'production' ? 3
    : config.environment === 'staging' ? 2
    : 1; // development

  for (const node of allNodes) {
    if (typeof node.config.replicas === 'number') {
      if (config.environment === 'production') {
        node.config.replicas = Math.max(node.config.replicas as number, replicaScale);
      } else {
        node.config.replicas = replicaScale;
      }
    }
  }

  // Auto-generate smart edges
  const allEdges = generateEdges(allNodes);

  return {
    nodes: allNodes,
    edges: allEdges,
    summary: {
      discovered: allNodes.length,
      connections: allEdges.length,
      services: serviceNames,
      provider: config.provider,
      environment: config.environment,
    },
  };
}

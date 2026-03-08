import type { ComponentDefinition } from '../types/components.js';

export const componentLibrary: ComponentDefinition[] = [
  // Frontend
  {
    type: 'web-app',
    category: 'frontend',
    label: 'Web App',
    icon: 'Globe',
    defaultConfig: { framework: 'React', replicas: 2, cdn: true },
    configSchema: [
      { key: 'framework', label: 'Framework', type: 'select', options: ['React', 'Vue', 'Angular', 'Next.js'], defaultValue: 'React' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
      { key: 'cdn', label: 'CDN Enabled', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'mobile-api',
    category: 'frontend',
    label: 'Mobile API',
    icon: 'Smartphone',
    defaultConfig: { protocol: 'REST', rateLimit: 1000 },
    configSchema: [
      { key: 'protocol', label: 'Protocol', type: 'select', options: ['REST', 'GraphQL', 'gRPC'], defaultValue: 'REST' },
      { key: 'rateLimit', label: 'Rate Limit', type: 'number', defaultValue: 1000, unit: 'req/s' },
    ],
  },
  {
    type: 'cdn',
    category: 'frontend',
    label: 'CDN',
    icon: 'Cloud',
    defaultConfig: { provider: 'CloudFront', cachePolicy: '24h' },
    configSchema: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['CloudFront', 'Cloudflare', 'Akamai', 'Fastly'], defaultValue: 'CloudFront' },
      { key: 'cachePolicy', label: 'Cache TTL', type: 'select', options: ['1h', '6h', '24h', '7d'], defaultValue: '24h' },
    ],
  },

  {
    type: 'static-site',
    category: 'frontend',
    label: 'Static Site',
    icon: 'FileText',
    defaultConfig: { generator: 'Astro', replicas: 2, cdn: true },
    configSchema: [
      { key: 'generator', label: 'Generator', type: 'select', options: ['Astro', 'Gatsby', 'Hugo', 'Eleventy'], defaultValue: 'Astro' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
      { key: 'cdn', label: 'CDN Enabled', type: 'boolean', defaultValue: true },
    ],
  },

  // Backend
  {
    type: 'api-service',
    category: 'backend',
    label: 'API Service',
    icon: 'Server',
    defaultConfig: { language: 'Node.js', replicas: 3, cpu: '500m', memory: '512MB', autoscaling: true },
    configSchema: [
      { key: 'language', label: 'Language', type: 'select', options: ['Node.js', 'Python', 'Go', 'Java', 'Rust'], defaultValue: 'Node.js' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 3 },
      { key: 'cpu', label: 'CPU', type: 'select', options: ['250m', '500m', '1000m', '2000m'], defaultValue: '500m' },
      { key: 'memory', label: 'Memory', type: 'select', options: ['256MB', '512MB', '1GB', '2GB', '4GB'], defaultValue: '512MB' },
      { key: 'autoscaling', label: 'Autoscaling', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'auth-service',
    category: 'backend',
    label: 'Auth Service',
    icon: 'Shield',
    defaultConfig: { provider: 'JWT', replicas: 2, sessionTTL: '24h' },
    configSchema: [
      { key: 'provider', label: 'Auth Type', type: 'select', options: ['JWT', 'OAuth2', 'SAML', 'Session'], defaultValue: 'JWT' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
      { key: 'sessionTTL', label: 'Session TTL', type: 'select', options: ['1h', '6h', '24h', '7d'], defaultValue: '24h' },
    ],
  },
  {
    type: 'worker-service',
    category: 'backend',
    label: 'Worker Service',
    icon: 'Cog',
    defaultConfig: { language: 'Python', replicas: 2, concurrency: 10 },
    configSchema: [
      { key: 'language', label: 'Language', type: 'select', options: ['Node.js', 'Python', 'Go', 'Java'], defaultValue: 'Python' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
      { key: 'concurrency', label: 'Concurrency', type: 'number', defaultValue: 10 },
    ],
  },
  {
    type: 'gateway',
    category: 'backend',
    label: 'Gateway',
    icon: 'ArrowLeftRight',
    defaultConfig: { type: 'REST', rateLimit: 5000, timeout: '30s' },
    configSchema: [
      { key: 'type', label: 'Type', type: 'select', options: ['REST', 'GraphQL', 'gRPC'], defaultValue: 'REST' },
      { key: 'rateLimit', label: 'Rate Limit', type: 'number', defaultValue: 5000, unit: 'req/s' },
      { key: 'timeout', label: 'Timeout', type: 'select', options: ['10s', '30s', '60s', '120s'], defaultValue: '30s' },
    ],
  },

  {
    type: 'graphql-server',
    category: 'backend',
    label: 'GraphQL Server',
    icon: 'GitBranch',
    defaultConfig: { language: 'Node.js', replicas: 3, cpu: '500m', memory: '512MB', autoscaling: true },
    configSchema: [
      { key: 'language', label: 'Language', type: 'select', options: ['Node.js', 'Go', 'Java', 'Python'], defaultValue: 'Node.js' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 3 },
      { key: 'cpu', label: 'CPU', type: 'select', options: ['250m', '500m', '1000m', '2000m'], defaultValue: '500m' },
      { key: 'memory', label: 'Memory', type: 'select', options: ['256MB', '512MB', '1GB', '2GB'], defaultValue: '512MB' },
      { key: 'autoscaling', label: 'Autoscaling', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'grpc-service',
    category: 'backend',
    label: 'gRPC Service',
    icon: 'Radio',
    defaultConfig: { language: 'Go', replicas: 3, cpu: '500m', memory: '256MB', autoscaling: true },
    configSchema: [
      { key: 'language', label: 'Language', type: 'select', options: ['Go', 'Java', 'Rust', 'C++'], defaultValue: 'Go' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 3 },
      { key: 'cpu', label: 'CPU', type: 'select', options: ['250m', '500m', '1000m', '2000m'], defaultValue: '500m' },
      { key: 'memory', label: 'Memory', type: 'select', options: ['128MB', '256MB', '512MB', '1GB'], defaultValue: '256MB' },
      { key: 'autoscaling', label: 'Autoscaling', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'cron-scheduler',
    category: 'backend',
    label: 'Cron / Scheduler',
    icon: 'Clock',
    defaultConfig: { language: 'Python', replicas: 1, concurrency: 5 },
    configSchema: [
      { key: 'language', label: 'Language', type: 'select', options: ['Python', 'Node.js', 'Go', 'Java'], defaultValue: 'Python' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 1 },
      { key: 'concurrency', label: 'Concurrency', type: 'number', defaultValue: 5 },
    ],
  },
  {
    type: 'notification-service',
    category: 'backend',
    label: 'Notification Service',
    icon: 'Bell',
    defaultConfig: { channels: 'email,push', replicas: 2, concurrency: 20 },
    configSchema: [
      { key: 'channels', label: 'Channels', type: 'text', defaultValue: 'email,push' },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 2 },
      { key: 'concurrency', label: 'Concurrency', type: 'number', defaultValue: 20 },
    ],
  },

  // Databases
  {
    type: 'postgresql',
    category: 'database',
    label: 'PostgreSQL',
    icon: 'Database',
    defaultConfig: { storage: '100GB', replication: 1, backup: true, maxConnections: 100 },
    configSchema: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'replication', label: 'Read Replicas', type: 'number', defaultValue: 1 },
      { key: 'backup', label: 'Automated Backup', type: 'boolean', defaultValue: true },
      { key: 'maxConnections', label: 'Max Connections', type: 'number', defaultValue: 100 },
    ],
  },
  {
    type: 'mysql',
    category: 'database',
    label: 'MySQL',
    icon: 'Database',
    defaultConfig: { storage: '100GB', replication: 1, backup: true, maxConnections: 150 },
    configSchema: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'replication', label: 'Read Replicas', type: 'number', defaultValue: 1 },
      { key: 'backup', label: 'Automated Backup', type: 'boolean', defaultValue: true },
      { key: 'maxConnections', label: 'Max Connections', type: 'number', defaultValue: 150 },
    ],
  },
  {
    type: 'mongodb',
    category: 'database',
    label: 'MongoDB',
    icon: 'Database',
    defaultConfig: { storage: '50GB', replicaSet: true, sharding: false },
    configSchema: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '50GB' },
      { key: 'replicaSet', label: 'Replica Set', type: 'boolean', defaultValue: true },
      { key: 'sharding', label: 'Sharding', type: 'boolean', defaultValue: false },
    ],
  },

  {
    type: 'elasticsearch',
    category: 'database',
    label: 'Elasticsearch',
    icon: 'Search',
    defaultConfig: { storage: '100GB', nodes: 3, shards: 5, replicas: 1 },
    configSchema: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'nodes', label: 'Data Nodes', type: 'number', defaultValue: 3 },
      { key: 'shards', label: 'Shards', type: 'number', defaultValue: 5 },
      { key: 'replicas', label: 'Replicas', type: 'number', defaultValue: 1 },
    ],
  },
  {
    type: 'dynamodb',
    category: 'database',
    label: 'DynamoDB',
    icon: 'Database',
    defaultConfig: { readCapacity: 100, writeCapacity: 100, onDemand: true },
    configSchema: [
      { key: 'readCapacity', label: 'Read Capacity', type: 'number', defaultValue: 100, unit: 'RCU' },
      { key: 'writeCapacity', label: 'Write Capacity', type: 'number', defaultValue: 100, unit: 'WCU' },
      { key: 'onDemand', label: 'On-Demand Mode', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'cassandra',
    category: 'database',
    label: 'Cassandra',
    icon: 'Database',
    defaultConfig: { storage: '500GB', nodes: 3, replicationFactor: 3 },
    configSchema: [
      { key: 'storage', label: 'Storage', type: 'select', options: ['100GB', '500GB', '1TB', '5TB'], defaultValue: '500GB' },
      { key: 'nodes', label: 'Nodes', type: 'number', defaultValue: 3 },
      { key: 'replicationFactor', label: 'Replication Factor', type: 'number', defaultValue: 3 },
    ],
  },

  // Caches
  {
    type: 'redis',
    category: 'cache',
    label: 'Redis',
    icon: 'Zap',
    defaultConfig: { memory: '2GB', evictionPolicy: 'allkeys-lru', cluster: false },
    configSchema: [
      { key: 'memory', label: 'Memory', type: 'select', options: ['512MB', '1GB', '2GB', '4GB', '8GB'], defaultValue: '2GB' },
      { key: 'evictionPolicy', label: 'Eviction Policy', type: 'select', options: ['allkeys-lru', 'volatile-lru', 'allkeys-random', 'noeviction'], defaultValue: 'allkeys-lru' },
      { key: 'cluster', label: 'Cluster Mode', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'memcached',
    category: 'cache',
    label: 'Memcached',
    icon: 'Zap',
    defaultConfig: { memory: '1GB', maxConnections: 1024 },
    configSchema: [
      { key: 'memory', label: 'Memory', type: 'select', options: ['512MB', '1GB', '2GB', '4GB'], defaultValue: '1GB' },
      { key: 'maxConnections', label: 'Max Connections', type: 'number', defaultValue: 1024 },
    ],
  },

  {
    type: 'varnish',
    category: 'cache',
    label: 'Varnish (HTTP Cache)',
    icon: 'Layers',
    defaultConfig: { memory: '2GB', maxObjects: 100000, ttl: '300s' },
    configSchema: [
      { key: 'memory', label: 'Memory', type: 'select', options: ['1GB', '2GB', '4GB', '8GB'], defaultValue: '2GB' },
      { key: 'maxObjects', label: 'Max Objects', type: 'number', defaultValue: 100000 },
      { key: 'ttl', label: 'Default TTL', type: 'select', options: ['60s', '300s', '600s', '3600s'], defaultValue: '300s' },
    ],
  },

  // Queues
  {
    type: 'kafka',
    category: 'queue',
    label: 'Kafka',
    icon: 'MailPlus',
    defaultConfig: { partitions: 6, replicationFactor: 3, retentionPeriod: '7d' },
    configSchema: [
      { key: 'partitions', label: 'Partitions', type: 'number', defaultValue: 6 },
      { key: 'replicationFactor', label: 'Replication Factor', type: 'number', defaultValue: 3 },
      { key: 'retentionPeriod', label: 'Retention', type: 'select', options: ['1d', '3d', '7d', '14d', '30d'], defaultValue: '7d' },
    ],
  },
  {
    type: 'rabbitmq',
    category: 'queue',
    label: 'RabbitMQ',
    icon: 'MailPlus',
    defaultConfig: { queues: 5, durable: true, maxMessageSize: '1MB' },
    configSchema: [
      { key: 'queues', label: 'Queues', type: 'number', defaultValue: 5 },
      { key: 'durable', label: 'Durable', type: 'boolean', defaultValue: true },
      { key: 'maxMessageSize', label: 'Max Message Size', type: 'select', options: ['256KB', '1MB', '5MB', '10MB'], defaultValue: '1MB' },
    ],
  },
  {
    type: 'sqs',
    category: 'queue',
    label: 'SQS',
    icon: 'MailPlus',
    defaultConfig: { type: 'Standard', visibilityTimeout: 30, retentionPeriod: '4d' },
    configSchema: [
      { key: 'type', label: 'Queue Type', type: 'select', options: ['Standard', 'FIFO'], defaultValue: 'Standard' },
      { key: 'visibilityTimeout', label: 'Visibility Timeout', type: 'number', defaultValue: 30, unit: 'sec' },
      { key: 'retentionPeriod', label: 'Retention', type: 'select', options: ['1d', '4d', '7d', '14d'], defaultValue: '4d' },
    ],
  },

  {
    type: 'nats',
    category: 'queue',
    label: 'NATS',
    icon: 'MailPlus',
    defaultConfig: { mode: 'JetStream', maxPayload: '1MB', cluster: true },
    configSchema: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['Core', 'JetStream'], defaultValue: 'JetStream' },
      { key: 'maxPayload', label: 'Max Payload', type: 'select', options: ['256KB', '1MB', '8MB'], defaultValue: '1MB' },
      { key: 'cluster', label: 'Cluster Mode', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'sns',
    category: 'queue',
    label: 'SNS (Pub/Sub)',
    icon: 'Megaphone',
    defaultConfig: { type: 'Standard', protocol: 'HTTPS' },
    configSchema: [
      { key: 'type', label: 'Topic Type', type: 'select', options: ['Standard', 'FIFO'], defaultValue: 'Standard' },
      { key: 'protocol', label: 'Protocol', type: 'select', options: ['HTTPS', 'SQS', 'Lambda', 'Email'], defaultValue: 'HTTPS' },
    ],
  },

  // Infrastructure
  {
    type: 'load-balancer',
    category: 'infrastructure',
    label: 'Load Balancer',
    icon: 'Split',
    defaultConfig: { algorithm: 'round-robin', healthCheckInterval: 30, maxConnections: 10000 },
    configSchema: [
      { key: 'algorithm', label: 'Algorithm', type: 'select', options: ['round-robin', 'least-connections', 'ip-hash', 'weighted'], defaultValue: 'round-robin' },
      { key: 'healthCheckInterval', label: 'Health Check', type: 'number', defaultValue: 30, unit: 'sec' },
      { key: 'maxConnections', label: 'Max Connections', type: 'number', defaultValue: 10000 },
    ],
  },
  {
    type: 'api-gateway',
    category: 'infrastructure',
    label: 'API Gateway',
    icon: 'Network',
    defaultConfig: { rateLimit: 10000, authentication: true, logging: true },
    configSchema: [
      { key: 'rateLimit', label: 'Rate Limit', type: 'number', defaultValue: 10000, unit: 'req/s' },
      { key: 'authentication', label: 'Authentication', type: 'boolean', defaultValue: true },
      { key: 'logging', label: 'Request Logging', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'message-broker',
    category: 'infrastructure',
    label: 'Message Broker',
    icon: 'Repeat',
    defaultConfig: { protocol: 'AMQP', maxThroughput: 50000, persistence: true },
    configSchema: [
      { key: 'protocol', label: 'Protocol', type: 'select', options: ['AMQP', 'MQTT', 'STOMP'], defaultValue: 'AMQP' },
      { key: 'maxThroughput', label: 'Max Throughput', type: 'number', defaultValue: 50000, unit: 'msg/s' },
      { key: 'persistence', label: 'Message Persistence', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'dns',
    category: 'infrastructure',
    label: 'DNS / Route 53',
    icon: 'Globe2',
    defaultConfig: { provider: 'Route53', routing: 'latency-based', healthCheck: true },
    configSchema: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['Route53', 'Cloudflare DNS', 'Google Cloud DNS'], defaultValue: 'Route53' },
      { key: 'routing', label: 'Routing Policy', type: 'select', options: ['simple', 'weighted', 'latency-based', 'geolocation', 'failover'], defaultValue: 'latency-based' },
      { key: 'healthCheck', label: 'Health Check', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'waf',
    category: 'infrastructure',
    label: 'WAF / Firewall',
    icon: 'ShieldCheck',
    defaultConfig: { provider: 'AWS WAF', ruleGroups: 3, rateLimit: 5000, logging: true },
    configSchema: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['AWS WAF', 'Cloudflare WAF', 'Akamai'], defaultValue: 'AWS WAF' },
      { key: 'ruleGroups', label: 'Rule Groups', type: 'number', defaultValue: 3 },
      { key: 'rateLimit', label: 'Rate Limit', type: 'number', defaultValue: 5000, unit: 'req/5min' },
      { key: 'logging', label: 'Logging', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'service-mesh',
    category: 'infrastructure',
    label: 'Service Mesh',
    icon: 'Waypoints',
    defaultConfig: { provider: 'Istio', mtls: true, tracing: true },
    configSchema: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['Istio', 'Linkerd', 'Consul Connect', 'Envoy'], defaultValue: 'Istio' },
      { key: 'mtls', label: 'mTLS', type: 'boolean', defaultValue: true },
      { key: 'tracing', label: 'Distributed Tracing', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'object-storage',
    category: 'infrastructure',
    label: 'Object Storage (S3)',
    icon: 'HardDrive',
    defaultConfig: { provider: 'S3', versioning: true, encryption: true, lifecycle: '90d' },
    configSchema: [
      { key: 'provider', label: 'Provider', type: 'select', options: ['S3', 'GCS', 'Azure Blob', 'MinIO'], defaultValue: 'S3' },
      { key: 'versioning', label: 'Versioning', type: 'boolean', defaultValue: true },
      { key: 'encryption', label: 'Encryption at Rest', type: 'boolean', defaultValue: true },
      { key: 'lifecycle', label: 'Lifecycle', type: 'select', options: ['30d', '90d', '365d', 'none'], defaultValue: '90d' },
    ],
  },

  // ─── AWS Services ───
  {
    type: 'aws-ec2', category: 'aws', label: 'AWS EC2', icon: 'Monitor',
    defaultConfig: { instanceType: 't3.medium', replicas: 2, cpu: '2000m', memory: '4GB', autoscaling: true },
    configSchema: [
      { key: 'instanceType', label: 'Instance Type', type: 'select', options: ['t3.micro', 't3.small', 't3.medium', 't3.large', 'm5.large', 'c5.xlarge'], defaultValue: 't3.medium' },
      { key: 'replicas', label: 'Instances', type: 'number', defaultValue: 2 },
      { key: 'autoscaling', label: 'Auto Scaling', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'aws-lambda', category: 'aws', label: 'AWS Lambda', icon: 'Sparkles',
    defaultConfig: { runtime: 'nodejs20.x', memory: 256, timeout: 30, concurrency: 100 },
    configSchema: [
      { key: 'runtime', label: 'Runtime', type: 'select', options: ['nodejs20.x', 'python3.12', 'go1.x', 'java21', 'dotnet8'], defaultValue: 'nodejs20.x' },
      { key: 'memory', label: 'Memory', type: 'select', options: ['128', '256', '512', '1024', '2048', '3008'], defaultValue: '256' },
      { key: 'timeout', label: 'Timeout', type: 'number', defaultValue: 30, unit: 'sec' },
      { key: 'concurrency', label: 'Reserved Concurrency', type: 'number', defaultValue: 100 },
    ],
  },
  {
    type: 'aws-s3', category: 'aws', label: 'AWS S3', icon: 'Cylinder',
    defaultConfig: { storageClass: 'STANDARD', versioning: true, encryption: true, lifecycle: '90d' },
    configSchema: [
      { key: 'storageClass', label: 'Storage Class', type: 'select', options: ['STANDARD', 'STANDARD_IA', 'GLACIER', 'DEEP_ARCHIVE'], defaultValue: 'STANDARD' },
      { key: 'versioning', label: 'Versioning', type: 'boolean', defaultValue: true },
      { key: 'encryption', label: 'Encryption', type: 'boolean', defaultValue: true },
      { key: 'lifecycle', label: 'Lifecycle', type: 'select', options: ['30d', '90d', '365d', 'none'], defaultValue: '90d' },
    ],
  },
  {
    type: 'aws-rds', category: 'aws', label: 'AWS RDS', icon: 'Database',
    defaultConfig: { engine: 'PostgreSQL', instanceClass: 'db.t3.medium', storage: '100GB', multiAZ: true, backup: true },
    configSchema: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['PostgreSQL', 'MySQL', 'MariaDB', 'Oracle', 'SQL Server'], defaultValue: 'PostgreSQL' },
      { key: 'instanceClass', label: 'Instance Class', type: 'select', options: ['db.t3.micro', 'db.t3.medium', 'db.r5.large', 'db.r5.xlarge'], defaultValue: 'db.t3.medium' },
      { key: 'storage', label: 'Storage', type: 'select', options: ['20GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'multiAZ', label: 'Multi-AZ', type: 'boolean', defaultValue: true },
      { key: 'backup', label: 'Automated Backup', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'aws-dynamodb', category: 'aws', label: 'AWS DynamoDB', icon: 'Database',
    defaultConfig: { readCapacity: 100, writeCapacity: 100, onDemand: true, globalTables: false },
    configSchema: [
      { key: 'readCapacity', label: 'Read Capacity', type: 'number', defaultValue: 100, unit: 'RCU' },
      { key: 'writeCapacity', label: 'Write Capacity', type: 'number', defaultValue: 100, unit: 'WCU' },
      { key: 'onDemand', label: 'On-Demand Mode', type: 'boolean', defaultValue: true },
      { key: 'globalTables', label: 'Global Tables', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'aws-ecs', category: 'aws', label: 'AWS ECS', icon: 'Container',
    defaultConfig: { launchType: 'FARGATE', cpu: '1024', memory: '2GB', desiredCount: 3, autoscaling: true },
    configSchema: [
      { key: 'launchType', label: 'Launch Type', type: 'select', options: ['FARGATE', 'EC2'], defaultValue: 'FARGATE' },
      { key: 'cpu', label: 'CPU', type: 'select', options: ['256', '512', '1024', '2048', '4096'], defaultValue: '1024' },
      { key: 'memory', label: 'Memory', type: 'select', options: ['512MB', '1GB', '2GB', '4GB', '8GB'], defaultValue: '2GB' },
      { key: 'desiredCount', label: 'Desired Tasks', type: 'number', defaultValue: 3 },
      { key: 'autoscaling', label: 'Auto Scaling', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'aws-eks', category: 'aws', label: 'AWS EKS', icon: 'Workflow',
    defaultConfig: { nodeType: 't3.medium', minNodes: 2, maxNodes: 10, version: '1.29' },
    configSchema: [
      { key: 'nodeType', label: 'Node Instance Type', type: 'select', options: ['t3.medium', 't3.large', 'm5.large', 'm5.xlarge', 'c5.xlarge'], defaultValue: 't3.medium' },
      { key: 'minNodes', label: 'Min Nodes', type: 'number', defaultValue: 2 },
      { key: 'maxNodes', label: 'Max Nodes', type: 'number', defaultValue: 10 },
      { key: 'version', label: 'K8s Version', type: 'select', options: ['1.27', '1.28', '1.29', '1.30'], defaultValue: '1.29' },
    ],
  },
  {
    type: 'aws-sqs', category: 'aws', label: 'AWS SQS', icon: 'Inbox',
    defaultConfig: { queueType: 'Standard', visibilityTimeout: 30, retentionPeriod: '4d', dlq: true },
    configSchema: [
      { key: 'queueType', label: 'Queue Type', type: 'select', options: ['Standard', 'FIFO'], defaultValue: 'Standard' },
      { key: 'visibilityTimeout', label: 'Visibility Timeout', type: 'number', defaultValue: 30, unit: 'sec' },
      { key: 'retentionPeriod', label: 'Retention', type: 'select', options: ['1d', '4d', '7d', '14d'], defaultValue: '4d' },
      { key: 'dlq', label: 'Dead Letter Queue', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'aws-sns', category: 'aws', label: 'AWS SNS', icon: 'Megaphone',
    defaultConfig: { topicType: 'Standard', protocol: 'HTTPS', encryption: true },
    configSchema: [
      { key: 'topicType', label: 'Topic Type', type: 'select', options: ['Standard', 'FIFO'], defaultValue: 'Standard' },
      { key: 'protocol', label: 'Protocol', type: 'select', options: ['HTTPS', 'SQS', 'Lambda', 'Email'], defaultValue: 'HTTPS' },
      { key: 'encryption', label: 'Encryption', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'aws-cloudfront', category: 'aws', label: 'AWS CloudFront', icon: 'Orbit',
    defaultConfig: { priceClass: 'PriceClass_100', httpVersion: 'http2and3', waf: true, cachePolicy: '24h' },
    configSchema: [
      { key: 'priceClass', label: 'Price Class', type: 'select', options: ['PriceClass_100', 'PriceClass_200', 'PriceClass_All'], defaultValue: 'PriceClass_100' },
      { key: 'httpVersion', label: 'HTTP Version', type: 'select', options: ['http1.1', 'http2', 'http2and3'], defaultValue: 'http2and3' },
      { key: 'waf', label: 'WAF Enabled', type: 'boolean', defaultValue: true },
      { key: 'cachePolicy', label: 'Cache TTL', type: 'select', options: ['1h', '6h', '24h', '7d'], defaultValue: '24h' },
    ],
  },
  {
    type: 'aws-route53', category: 'aws', label: 'AWS Route 53', icon: 'Globe2',
    defaultConfig: { routing: 'latency-based', healthCheck: true, failover: true },
    configSchema: [
      { key: 'routing', label: 'Routing Policy', type: 'select', options: ['simple', 'weighted', 'latency-based', 'geolocation', 'failover'], defaultValue: 'latency-based' },
      { key: 'healthCheck', label: 'Health Check', type: 'boolean', defaultValue: true },
      { key: 'failover', label: 'Failover', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'aws-cognito', category: 'aws', label: 'AWS Cognito', icon: 'KeyRound',
    defaultConfig: { mfa: true, oAuth: true, passwordPolicy: 'strong', advancedSecurity: true },
    configSchema: [
      { key: 'mfa', label: 'MFA', type: 'boolean', defaultValue: true },
      { key: 'oAuth', label: 'OAuth 2.0', type: 'boolean', defaultValue: true },
      { key: 'passwordPolicy', label: 'Password Policy', type: 'select', options: ['basic', 'strong', 'custom'], defaultValue: 'strong' },
      { key: 'advancedSecurity', label: 'Advanced Security', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'aws-api-gateway', category: 'aws', label: 'AWS API Gateway', icon: 'Route',
    defaultConfig: { type: 'REST', throttle: 10000, auth: 'Cognito', caching: true },
    configSchema: [
      { key: 'type', label: 'API Type', type: 'select', options: ['REST', 'HTTP', 'WebSocket'], defaultValue: 'REST' },
      { key: 'throttle', label: 'Throttle Limit', type: 'number', defaultValue: 10000, unit: 'req/s' },
      { key: 'auth', label: 'Authorization', type: 'select', options: ['None', 'IAM', 'Cognito', 'Lambda'], defaultValue: 'Cognito' },
      { key: 'caching', label: 'API Caching', type: 'boolean', defaultValue: true },
    ],
  },

  // ─── Azure Services ───
  {
    type: 'azure-vm', category: 'azure', label: 'Azure VM', icon: 'Monitor',
    defaultConfig: { size: 'Standard_D2s_v3', replicas: 2, os: 'Ubuntu 22.04', autoscaling: true },
    configSchema: [
      { key: 'size', label: 'VM Size', type: 'select', options: ['Standard_B2s', 'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_E2s_v3', 'Standard_F4s_v2'], defaultValue: 'Standard_D2s_v3' },
      { key: 'replicas', label: 'Instances', type: 'number', defaultValue: 2 },
      { key: 'os', label: 'OS', type: 'select', options: ['Ubuntu 22.04', 'Windows Server 2022', 'RHEL 9', 'Debian 12'], defaultValue: 'Ubuntu 22.04' },
      { key: 'autoscaling', label: 'Auto Scaling', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'azure-functions', category: 'azure', label: 'Azure Functions', icon: 'Sparkles',
    defaultConfig: { runtime: 'node', plan: 'Consumption', memory: 256, timeout: 30 },
    configSchema: [
      { key: 'runtime', label: 'Runtime', type: 'select', options: ['node', 'python', 'dotnet', 'java', 'powershell'], defaultValue: 'node' },
      { key: 'plan', label: 'Plan', type: 'select', options: ['Consumption', 'Premium', 'Dedicated'], defaultValue: 'Consumption' },
      { key: 'memory', label: 'Memory (MB)', type: 'select', options: ['128', '256', '512', '1024', '1536'], defaultValue: '256' },
      { key: 'timeout', label: 'Timeout', type: 'number', defaultValue: 30, unit: 'sec' },
    ],
  },
  {
    type: 'azure-blob', category: 'azure', label: 'Azure Blob Storage', icon: 'Cylinder',
    defaultConfig: { tier: 'Hot', redundancy: 'LRS', versioning: true, encryption: true },
    configSchema: [
      { key: 'tier', label: 'Access Tier', type: 'select', options: ['Hot', 'Cool', 'Archive'], defaultValue: 'Hot' },
      { key: 'redundancy', label: 'Redundancy', type: 'select', options: ['LRS', 'ZRS', 'GRS', 'RA-GRS'], defaultValue: 'LRS' },
      { key: 'versioning', label: 'Versioning', type: 'boolean', defaultValue: true },
      { key: 'encryption', label: 'Encryption', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'azure-sql', category: 'azure', label: 'Azure SQL', icon: 'Database',
    defaultConfig: { tier: 'General Purpose', vCores: 2, storage: '100GB', backup: true, failoverGroup: false },
    configSchema: [
      { key: 'tier', label: 'Service Tier', type: 'select', options: ['Basic', 'Standard', 'General Purpose', 'Business Critical', 'Hyperscale'], defaultValue: 'General Purpose' },
      { key: 'vCores', label: 'vCores', type: 'select', options: ['2', '4', '8', '16', '32'], defaultValue: '2' },
      { key: 'storage', label: 'Storage', type: 'select', options: ['32GB', '100GB', '250GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'backup', label: 'Automated Backup', type: 'boolean', defaultValue: true },
      { key: 'failoverGroup', label: 'Failover Group', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'azure-cosmos', category: 'azure', label: 'Azure Cosmos DB', icon: 'Database',
    defaultConfig: { api: 'NoSQL', throughput: 400, multiRegion: false, consistency: 'Session' },
    configSchema: [
      { key: 'api', label: 'API', type: 'select', options: ['NoSQL', 'MongoDB', 'Cassandra', 'Gremlin', 'Table'], defaultValue: 'NoSQL' },
      { key: 'throughput', label: 'Throughput', type: 'number', defaultValue: 400, unit: 'RU/s' },
      { key: 'multiRegion', label: 'Multi-Region Writes', type: 'boolean', defaultValue: false },
      { key: 'consistency', label: 'Consistency', type: 'select', options: ['Strong', 'Bounded Staleness', 'Session', 'Consistent Prefix', 'Eventual'], defaultValue: 'Session' },
    ],
  },
  {
    type: 'azure-aks', category: 'azure', label: 'Azure AKS', icon: 'Workflow',
    defaultConfig: { nodeSize: 'Standard_D2s_v3', minNodes: 2, maxNodes: 10, version: '1.29' },
    configSchema: [
      { key: 'nodeSize', label: 'Node VM Size', type: 'select', options: ['Standard_B2s', 'Standard_D2s_v3', 'Standard_D4s_v3', 'Standard_E2s_v3'], defaultValue: 'Standard_D2s_v3' },
      { key: 'minNodes', label: 'Min Nodes', type: 'number', defaultValue: 2 },
      { key: 'maxNodes', label: 'Max Nodes', type: 'number', defaultValue: 10 },
      { key: 'version', label: 'K8s Version', type: 'select', options: ['1.27', '1.28', '1.29', '1.30'], defaultValue: '1.29' },
    ],
  },
  {
    type: 'azure-service-bus', category: 'azure', label: 'Azure Service Bus', icon: 'Inbox',
    defaultConfig: { tier: 'Standard', queues: 5, topics: 3, partitioning: true },
    configSchema: [
      { key: 'tier', label: 'Tier', type: 'select', options: ['Basic', 'Standard', 'Premium'], defaultValue: 'Standard' },
      { key: 'queues', label: 'Queues', type: 'number', defaultValue: 5 },
      { key: 'topics', label: 'Topics', type: 'number', defaultValue: 3 },
      { key: 'partitioning', label: 'Partitioning', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'azure-cdn', category: 'azure', label: 'Azure CDN', icon: 'Orbit',
    defaultConfig: { tier: 'Standard_Microsoft', caching: true, compression: true, waf: false },
    configSchema: [
      { key: 'tier', label: 'CDN Tier', type: 'select', options: ['Standard_Microsoft', 'Standard_Akamai', 'Standard_Verizon', 'Premium_Verizon'], defaultValue: 'Standard_Microsoft' },
      { key: 'caching', label: 'Caching', type: 'boolean', defaultValue: true },
      { key: 'compression', label: 'Compression', type: 'boolean', defaultValue: true },
      { key: 'waf', label: 'WAF', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'azure-ad', category: 'azure', label: 'Azure AD / Entra ID', icon: 'KeyRound',
    defaultConfig: { tier: 'P1', mfa: true, conditionalAccess: true, sso: true },
    configSchema: [
      { key: 'tier', label: 'Tier', type: 'select', options: ['Free', 'P1', 'P2'], defaultValue: 'P1' },
      { key: 'mfa', label: 'MFA', type: 'boolean', defaultValue: true },
      { key: 'conditionalAccess', label: 'Conditional Access', type: 'boolean', defaultValue: true },
      { key: 'sso', label: 'SSO', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'azure-api-mgmt', category: 'azure', label: 'Azure API Management', icon: 'Route',
    defaultConfig: { tier: 'Developer', capacity: 1, rateLimit: 5000, caching: true },
    configSchema: [
      { key: 'tier', label: 'Tier', type: 'select', options: ['Consumption', 'Developer', 'Basic', 'Standard', 'Premium'], defaultValue: 'Developer' },
      { key: 'capacity', label: 'Scale Units', type: 'number', defaultValue: 1 },
      { key: 'rateLimit', label: 'Rate Limit', type: 'number', defaultValue: 5000, unit: 'req/s' },
      { key: 'caching', label: 'Response Caching', type: 'boolean', defaultValue: true },
    ],
  },

  // ─── GCP Services ───
  {
    type: 'gcp-compute', category: 'gcp', label: 'GCP Compute Engine', icon: 'Monitor',
    defaultConfig: { machineType: 'e2-medium', replicas: 2, zone: 'us-central1-a', preemptible: false },
    configSchema: [
      { key: 'machineType', label: 'Machine Type', type: 'select', options: ['e2-micro', 'e2-small', 'e2-medium', 'n2-standard-2', 'n2-standard-4', 'c2-standard-4'], defaultValue: 'e2-medium' },
      { key: 'replicas', label: 'Instances', type: 'number', defaultValue: 2 },
      { key: 'zone', label: 'Zone', type: 'select', options: ['us-central1-a', 'us-east1-b', 'europe-west1-b', 'asia-east1-a'], defaultValue: 'us-central1-a' },
      { key: 'preemptible', label: 'Preemptible', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'gcp-cloud-functions', category: 'gcp', label: 'GCP Cloud Functions', icon: 'Sparkles',
    defaultConfig: { runtime: 'nodejs20', memory: 256, timeout: 60, maxInstances: 100 },
    configSchema: [
      { key: 'runtime', label: 'Runtime', type: 'select', options: ['nodejs20', 'python312', 'go122', 'java17', 'dotnet8'], defaultValue: 'nodejs20' },
      { key: 'memory', label: 'Memory (MB)', type: 'select', options: ['128', '256', '512', '1024', '2048', '4096'], defaultValue: '256' },
      { key: 'timeout', label: 'Timeout', type: 'number', defaultValue: 60, unit: 'sec' },
      { key: 'maxInstances', label: 'Max Instances', type: 'number', defaultValue: 100 },
    ],
  },
  {
    type: 'gcp-cloud-storage', category: 'gcp', label: 'GCP Cloud Storage', icon: 'Cylinder',
    defaultConfig: { storageClass: 'STANDARD', location: 'us-central1', versioning: true, uniformAccess: true },
    configSchema: [
      { key: 'storageClass', label: 'Storage Class', type: 'select', options: ['STANDARD', 'NEARLINE', 'COLDLINE', 'ARCHIVE'], defaultValue: 'STANDARD' },
      { key: 'location', label: 'Location', type: 'select', options: ['us-central1', 'us-east1', 'europe-west1', 'asia-east1'], defaultValue: 'us-central1' },
      { key: 'versioning', label: 'Versioning', type: 'boolean', defaultValue: true },
      { key: 'uniformAccess', label: 'Uniform Access', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'gcp-cloud-sql', category: 'gcp', label: 'GCP Cloud SQL', icon: 'Database',
    defaultConfig: { engine: 'PostgreSQL', tier: 'db-custom-2-8192', storage: '100GB', highAvailability: true, backup: true },
    configSchema: [
      { key: 'engine', label: 'Engine', type: 'select', options: ['PostgreSQL', 'MySQL', 'SQL Server'], defaultValue: 'PostgreSQL' },
      { key: 'tier', label: 'Machine Type', type: 'select', options: ['db-f1-micro', 'db-custom-1-3840', 'db-custom-2-8192', 'db-custom-4-16384'], defaultValue: 'db-custom-2-8192' },
      { key: 'storage', label: 'Storage', type: 'select', options: ['10GB', '50GB', '100GB', '500GB', '1TB'], defaultValue: '100GB' },
      { key: 'highAvailability', label: 'High Availability', type: 'boolean', defaultValue: true },
      { key: 'backup', label: 'Automated Backup', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'gcp-firestore', category: 'gcp', label: 'GCP Firestore', icon: 'Database',
    defaultConfig: { mode: 'Native', location: 'us-central', multiRegion: false },
    configSchema: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['Native', 'Datastore'], defaultValue: 'Native' },
      { key: 'location', label: 'Location', type: 'select', options: ['us-central', 'us-east1', 'europe-west1', 'asia-east1'], defaultValue: 'us-central' },
      { key: 'multiRegion', label: 'Multi-Region', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'gcp-gke', category: 'gcp', label: 'GCP GKE', icon: 'Workflow',
    defaultConfig: { machineType: 'e2-medium', minNodes: 2, maxNodes: 10, version: '1.29', autopilot: false },
    configSchema: [
      { key: 'machineType', label: 'Node Machine Type', type: 'select', options: ['e2-medium', 'e2-standard-4', 'n2-standard-2', 'n2-standard-4'], defaultValue: 'e2-medium' },
      { key: 'minNodes', label: 'Min Nodes', type: 'number', defaultValue: 2 },
      { key: 'maxNodes', label: 'Max Nodes', type: 'number', defaultValue: 10 },
      { key: 'version', label: 'GKE Version', type: 'select', options: ['1.27', '1.28', '1.29', '1.30'], defaultValue: '1.29' },
      { key: 'autopilot', label: 'Autopilot Mode', type: 'boolean', defaultValue: false },
    ],
  },
  {
    type: 'gcp-pubsub', category: 'gcp', label: 'GCP Pub/Sub', icon: 'Megaphone',
    defaultConfig: { messageRetention: '7d', ackDeadline: 10, ordering: false, dlq: true },
    configSchema: [
      { key: 'messageRetention', label: 'Message Retention', type: 'select', options: ['1d', '3d', '7d', '14d', '31d'], defaultValue: '7d' },
      { key: 'ackDeadline', label: 'Ack Deadline', type: 'number', defaultValue: 10, unit: 'sec' },
      { key: 'ordering', label: 'Ordering', type: 'boolean', defaultValue: false },
      { key: 'dlq', label: 'Dead Letter Topic', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'gcp-cloud-cdn', category: 'gcp', label: 'GCP Cloud CDN', icon: 'Orbit',
    defaultConfig: { cacheMode: 'CACHE_ALL_STATIC', signedUrls: false, compression: true },
    configSchema: [
      { key: 'cacheMode', label: 'Cache Mode', type: 'select', options: ['CACHE_ALL_STATIC', 'USE_ORIGIN_HEADERS', 'FORCE_CACHE_ALL'], defaultValue: 'CACHE_ALL_STATIC' },
      { key: 'signedUrls', label: 'Signed URLs', type: 'boolean', defaultValue: false },
      { key: 'compression', label: 'Compression', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'gcp-iam', category: 'gcp', label: 'GCP IAM', icon: 'KeyRound',
    defaultConfig: { workloadIdentity: true, auditLogging: true, orgPolicy: true },
    configSchema: [
      { key: 'workloadIdentity', label: 'Workload Identity', type: 'boolean', defaultValue: true },
      { key: 'auditLogging', label: 'Audit Logging', type: 'boolean', defaultValue: true },
      { key: 'orgPolicy', label: 'Org Policy', type: 'boolean', defaultValue: true },
    ],
  },
  {
    type: 'gcp-api-gateway', category: 'gcp', label: 'GCP API Gateway', icon: 'Route',
    defaultConfig: { auth: 'API Key', rateLimit: 5000, logging: true },
    configSchema: [
      { key: 'auth', label: 'Authentication', type: 'select', options: ['None', 'API Key', 'Firebase Auth', 'Service Account'], defaultValue: 'API Key' },
      { key: 'rateLimit', label: 'Rate Limit', type: 'number', defaultValue: 5000, unit: 'req/s' },
      { key: 'logging', label: 'Logging', type: 'boolean', defaultValue: true },
    ],
  },
];

export const categoryLabels: Record<string, string> = {
  frontend: 'Frontend',
  backend: 'Backend Services',
  database: 'Databases',
  cache: 'Caches',
  queue: 'Message Queues',
  infrastructure: 'Infrastructure',
  aws: 'AWS Services',
  azure: 'Azure Services',
  gcp: 'GCP Services',
};

export const categoryColors: Record<string, string> = {
  frontend: '#3b82f6',
  backend: '#8b5cf6',
  database: '#f59e0b',
  cache: '#10b981',
  queue: '#ec4899',
  infrastructure: '#6366f1',
  aws: '#ff9900',
  azure: '#0078d4',
  gcp: '#4285f4',
};

import { Router } from 'express';
import { authMiddleware } from '../services/auth.js';
import { importInfrastructure, servicesByCategory } from '../services/infraImporter.js';

const router = Router();

router.post('/discover', authMiddleware, (req, res) => {
  const { provider, environment, services } = req.body;
  if (!provider || !services || !Array.isArray(services)) {
    res.status(400).json({ error: 'Provider and services array are required' });
    return;
  }
  try {
    const result = importInfrastructure({ provider, environment: environment || 'production', services });
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: 'Import failed' });
  }
});

// Available service categories per provider
router.get('/providers', (_req, res) => {
  const categories = Object.keys(servicesByCategory);
  res.json({
    aws: { name: 'Amazon Web Services', services: categories },
    gcp: { name: 'Google Cloud Platform', services: categories },
    azure: { name: 'Microsoft Azure', services: categories },
    categoryDescriptions: {
      compute: 'Virtual machines, serverless functions, containers, Kubernetes',
      storage: 'Object storage, block storage, file systems',
      databases: 'SQL, NoSQL, data warehouse, in-memory cache',
      networking: 'Load balancers, DNS, CDN, WAF, VPN',
      containers: 'Container registries, service mesh',
      devops: 'CI/CD build, deploy, and pipeline services',
      messaging: 'Message queues, event buses, workflow orchestration',
      security: 'IAM, auth, secrets, encryption, threat detection',
      observability: 'Metrics, logging, distributed tracing',
      data_engineering: 'Streaming, ETL, batch processing',
      ai_ml: 'Machine learning, AI APIs, computer vision',
      api: 'API gateways, GraphQL, integration',
      hybrid: 'Hybrid cloud, edge computing, on-premises',
      migration: 'Database and application migration services',
      developer: 'Full-stack platforms, mobile testing',
      cost_management: 'Cloud cost analysis and billing reports',
      analytics: 'BI dashboards, search engines',
      iac: 'Infrastructure as Code templates and tools',
      cdn_security: 'Global load balancing, DDoS protection',
      devops_tools: 'CI/CD, monitoring, GitOps, service mesh',
    },
  });
});

export { router as infraImportRouter };

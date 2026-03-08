import type { Architecture } from '@systemtwin/shared';
import type { ArchitectureScore, CategoryScore, Finding } from '@systemtwin/shared';

function toGrade(score: number): string {
  if (score >= 93) return 'A+';
  if (score >= 87) return 'A';
  if (score >= 83) return 'A-';
  if (score >= 78) return 'B+';
  if (score >= 73) return 'B';
  if (score >= 68) return 'B-';
  if (score >= 63) return 'C+';
  if (score >= 58) return 'C';
  if (score >= 53) return 'C-';
  if (score >= 45) return 'D';
  return 'F';
}

export function scoreArchitecture(architecture: Architecture): ArchitectureScore {
  const { nodes, edges } = architecture;
  const findings: Finding[] = [];

  // Helpers
  const hasType = (type: string) => nodes.some(n => n.type === type);
  const nodesByCategory = (cat: string) => nodes.filter(n => n.category === cat);
  const backendsWithAutoscaling = nodes.filter(n => n.category === 'backend' && n.config.autoscaling === true);
  const hasLB = hasType('load-balancer');
  const hasGW = hasType('api-gateway');
  const hasAuth = hasType('auth-service');
  const hasCache = nodes.some(n => n.category === 'cache');
  const hasQueue = nodes.some(n => n.category === 'queue');
  const hasWAF = hasType('waf');
  const hasMesh = hasType('service-mesh');
  const hasCDN = hasType('cdn');
  const databases = nodesByCategory('database');
  const backends = nodesByCategory('backend');

  // ── Resilience ──
  let resilience = 100;
  const singlePoints = nodes.filter(n =>
    n.category === 'backend' && (!n.config.replicas || (n.config.replicas as number) <= 1)
  );
  resilience -= singlePoints.length * 15;
  singlePoints.forEach(n => findings.push({ severity: 'warning', category: 'Resilience', message: `${n.label} has no replicas — single point of failure` }));

  const dbsNoReplication = databases.filter(n => !n.config.replication && !n.config.replicaSet);
  resilience -= dbsNoReplication.length * 15;
  dbsNoReplication.forEach(n => findings.push({ severity: 'critical', category: 'Resilience', message: `${n.label} has no replication configured` }));

  if (!hasLB && backends.length > 3) { resilience -= 10; findings.push({ severity: 'warning', category: 'Resilience', message: 'No load balancer with multiple backend services' }); }
  if (!hasCache) { resilience -= 10; findings.push({ severity: 'info', category: 'Resilience', message: 'No cache layer — direct database hits increase failure risk' }); }
  if (hasQueue) { resilience += 10; findings.push({ severity: 'good', category: 'Resilience', message: 'Message queue provides async decoupling' }); }
  resilience += backendsWithAutoscaling.length * 3;
  resilience = Math.max(0, Math.min(100, resilience));

  // ── Cost Efficiency ──
  let cost = 80;
  if (backendsWithAutoscaling.length > 0) { cost += 10; findings.push({ severity: 'good', category: 'Cost', message: 'Autoscaling reduces idle resource waste' }); }
  if (hasCDN) { cost += 5; findings.push({ severity: 'good', category: 'Cost', message: 'CDN reduces origin server load' }); }
  const overProvisioned = nodes.filter(n => (n.config.replicas as number) > 4);
  overProvisioned.forEach(n => { cost -= 5; findings.push({ severity: 'info', category: 'Cost', message: `${n.label} has ${n.config.replicas} replicas — verify if needed` }); });
  cost = Math.max(0, Math.min(100, cost));

  // ── Scalability ──
  let scalability = 60;
  if (hasLB) { scalability += 10; findings.push({ severity: 'good', category: 'Scalability', message: 'Load balancer enables horizontal scaling' }); }
  if (hasCache) scalability += 10;
  if (hasQueue) { scalability += 10; findings.push({ severity: 'good', category: 'Scalability', message: 'Message queue enables async workload scaling' }); }
  scalability += backendsWithAutoscaling.length * 3;

  // Check if single DB serves many services
  databases.forEach(db => {
    const incomingEdges = edges.filter(e => e.target === db.id).length;
    if (incomingEdges > 4) {
      scalability -= 10;
      findings.push({ severity: 'warning', category: 'Scalability', message: `${db.label} serves ${incomingEdges} services — consider read replicas or database-per-service` });
    }
  });
  scalability = Math.max(0, Math.min(100, scalability));

  // ── Security ──
  let security = 50;
  if (hasAuth) { security += 20; findings.push({ severity: 'good', category: 'Security', message: 'Dedicated auth service present' }); }
  else { security -= 15; findings.push({ severity: 'critical', category: 'Security', message: 'No auth service — authentication may be missing' }); }
  if (hasGW) {
    security += 10;
    const gw = nodes.find(n => n.type === 'api-gateway');
    if (gw?.config.authentication) { security += 5; }
  } else {
    security -= 10; findings.push({ severity: 'warning', category: 'Security', message: 'No API gateway — no centralized auth/rate-limiting' });
  }
  if (hasWAF) { security += 10; findings.push({ severity: 'good', category: 'Security', message: 'WAF provides DDoS and injection protection' }); }
  if (hasMesh) { security += 10; findings.push({ severity: 'good', category: 'Security', message: 'Service mesh enables mTLS between services' }); }
  security = Math.max(0, Math.min(100, security));

  // ── Complexity ──
  let complexity: number;
  if (nodes.length <= 5) complexity = 20;
  else if (nodes.length <= 10) complexity = 50;
  else if (nodes.length <= 15) complexity = 70;
  else complexity = 90;
  complexity += Math.min(20, edges.length * 2);
  complexity = Math.min(100, complexity);

  if (complexity > 70) findings.push({ severity: 'info', category: 'Complexity', message: `Architecture has ${nodes.length} nodes and ${edges.length} edges — consider simplifying` });

  const overallNumeric = Math.round((resilience + cost + scalability + security + (100 - complexity)) / 5);

  return {
    overall: toGrade(overallNumeric),
    overallNumeric,
    categories: {
      resilience: { grade: toGrade(resilience), score: resilience, details: `${singlePoints.length} single points of failure detected` },
      costEfficiency: { grade: toGrade(cost), score: cost, details: `${backendsWithAutoscaling.length} services with autoscaling` },
      scalability: { grade: toGrade(scalability), score: scalability, details: `${hasLB ? 'LB' : 'No LB'}, ${hasCache ? 'Cache' : 'No cache'}, ${hasQueue ? 'Queue' : 'No queue'}` },
      security: { grade: toGrade(security), score: security, details: `${hasAuth ? 'Auth' : 'No auth'}, ${hasGW ? 'Gateway' : 'No gateway'}, ${hasWAF ? 'WAF' : 'No WAF'}` },
      complexity: { grade: toGrade(100 - complexity), score: 100 - complexity, details: `${nodes.length} nodes, ${edges.length} connections` },
    },
    findings,
  };
}

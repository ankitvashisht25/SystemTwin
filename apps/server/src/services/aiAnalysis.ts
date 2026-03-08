import Anthropic from '@anthropic-ai/sdk';
import type { Architecture } from '@systemtwin/shared';
import type { NodeMetrics, LogEntry, ActiveFailure, AnalysisReport } from '@systemtwin/shared';

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function analyzeSimulation(
  architecture: Architecture,
  metrics: NodeMetrics[][],
  logs: LogEntry[],
  failures: ActiveFailure[]
): Promise<AnalysisReport> {
  if (!anthropic) {
    return generateMockAnalysis(architecture, metrics, logs, failures);
  }

  try {
    return await generateAIAnalysis(architecture, metrics, logs, failures);
  } catch (error) {
    console.error('AI analysis failed, falling back to mock:', error);
    return generateMockAnalysis(architecture, metrics, logs, failures);
  }
}

async function generateAIAnalysis(
  architecture: Architecture,
  metrics: NodeMetrics[][],
  logs: LogEntry[],
  failures: ActiveFailure[]
): Promise<AnalysisReport> {
  const recentMetrics = metrics.slice(-10);
  const recentLogs = logs.slice(-50);

  const systemPrompt = `You are a system architecture resilience analyst. Analyze simulation data and provide structured insights. Respond ONLY with valid JSON matching this schema:
{
  "summary": "1-3 sentence overview of the simulation results",
  "rootCause": "Root cause analysis of any failures or degradation",
  "cascadingEffects": ["Array of cascading effects observed"],
  "recommendations": ["Array of actionable recommendations"],
  "timeline": [{"time": <tick_number>, "event": "description"}]
}`;

  const nodeTopology = architecture.nodes.map(n => `- ${n.label} (${n.type}, ${n.category})`).join('\n');
  const edgeTopology = architecture.edges.map(e => {
    const src = architecture.nodes.find(n => n.id === e.source)?.label || e.source;
    const tgt = architecture.nodes.find(n => n.id === e.target)?.label || e.target;
    return `- ${src} -> ${tgt}`;
  }).join('\n');

  const failureDetails = failures.map(f => {
    const node = architecture.nodes.find(n => n.id === f.nodeId);
    return `- ${f.type} on ${node?.label || f.nodeId} at tick ${f.startedAt}`;
  }).join('\n');

  const avgMetrics = new Map<string, { cpu: number; memory: number; latency: number; errorRate: number }>();
  for (const tick of recentMetrics) {
    for (const m of tick) {
      const existing = avgMetrics.get(m.nodeId) || { cpu: 0, memory: 0, latency: 0, errorRate: 0 };
      existing.cpu += m.cpu / recentMetrics.length;
      existing.memory += m.memory / recentMetrics.length;
      existing.latency += m.latency / recentMetrics.length;
      existing.errorRate += m.errorRate / recentMetrics.length;
      avgMetrics.set(m.nodeId, existing);
    }
  }

  const metricsStr = Array.from(avgMetrics.entries()).map(([id, m]) => {
    const node = architecture.nodes.find(n => n.id === id);
    return `- ${node?.label || id}: CPU ${m.cpu.toFixed(1)}%, Mem ${m.memory.toFixed(1)}%, Latency ${m.latency.toFixed(0)}ms, Error ${m.errorRate.toFixed(1)}%`;
  }).join('\n');

  const errorLogs = recentLogs.filter(l => l.level === 'ERROR').slice(0, 20);
  const logsStr = errorLogs.map(l => {
    const node = architecture.nodes.find(n => n.id === l.nodeId);
    return `[${l.level}] ${node?.label || l.nodeId}: ${l.message}`;
  }).join('\n');

  const userMessage = `Analyze this system simulation:

## Architecture (${architecture.nodes.length} nodes)
${nodeTopology}

## Connections
${edgeTopology}

## Injected Failures (${failures.length})
${failureDetails || 'None'}

## Average Metrics (last 10 ticks)
${metricsStr || 'No metrics available'}

## Recent Error Logs
${logsStr || 'No error logs'}`;

  const response = await anthropic!.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const parsed = JSON.parse(text);

  return {
    summary: parsed.summary || 'Analysis complete.',
    rootCause: parsed.rootCause || 'No root cause identified.',
    cascadingEffects: parsed.cascadingEffects || [],
    recommendations: parsed.recommendations || [],
    timeline: parsed.timeline || [],
  };
}

function generateMockAnalysis(
  architecture: Architecture,
  metrics: NodeMetrics[][],
  logs: LogEntry[],
  failures: ActiveFailure[]
): AnalysisReport {
  const errorLogs = logs.filter((l) => l.level === 'ERROR');
  const warnLogs = logs.filter((l) => l.level === 'WARN');

  // Find nodes that had failures
  const failedNodeIds = [...new Set(failures.map((f) => f.nodeId))];
  const failedNodes = architecture.nodes.filter((n) => failedNodeIds.includes(n.id));

  // Compute average metrics for the last 10 ticks
  const recentMetrics = metrics.slice(-10);
  const avgMetrics = new Map<string, { cpu: number; memory: number; latency: number; errorRate: number }>();
  for (const tick of recentMetrics) {
    for (const m of tick) {
      const existing = avgMetrics.get(m.nodeId) || { cpu: 0, memory: 0, latency: 0, errorRate: 0 };
      existing.cpu += m.cpu / recentMetrics.length;
      existing.memory += m.memory / recentMetrics.length;
      existing.latency += m.latency / recentMetrics.length;
      existing.errorRate += m.errorRate / recentMetrics.length;
      avgMetrics.set(m.nodeId, existing);
    }
  }

  // Build root cause based on failure types
  const rootCauses: string[] = [];
  const cascadingEffects: string[] = [];
  const recommendations: string[] = [];
  const timeline: Array<{ time: number; event: string }> = [];

  for (const failure of failures) {
    const node = architecture.nodes.find((n) => n.id === failure.nodeId);
    const nodeName = node?.label || failure.nodeId;

    switch (failure.type) {
      case 'crash':
        rootCauses.push(`${nodeName} experienced a service crash, causing complete service unavailability.`);
        recommendations.push(`Implement health checks and automatic restart policies for ${nodeName}.`);
        recommendations.push(`Add circuit breakers to upstream services to prevent cascade failures.`);
        break;
      case 'latency':
        rootCauses.push(`${nodeName} experienced increased network latency (+500ms), degrading response times.`);
        recommendations.push(`Implement request timeouts and retry policies with exponential backoff.`);
        break;
      case 'partition':
        rootCauses.push(`${nodeName} was isolated due to a network partition, breaking all communication.`);
        recommendations.push(`Deploy ${nodeName} across multiple availability zones for redundancy.`);
        break;
      case 'resource-exhaustion':
        rootCauses.push(`${nodeName} experienced resource exhaustion (CPU/Memory), causing severe degradation.`);
        recommendations.push(`Review resource limits and enable autoscaling for ${nodeName}.`);
        break;
    }

    timeline.push({ time: failure.startedAt, event: `Failure injected: ${failure.type} on ${nodeName}` });
  }

  // Find cascade effects
  const degradedNodes = Array.from(avgMetrics.entries())
    .filter(([id, m]) => !failedNodeIds.includes(id) && (m.errorRate > 5 || m.latency > 200))
    .map(([id]) => id);

  for (const nodeId of degradedNodes) {
    const node = architecture.nodes.find((n) => n.id === nodeId);
    const avg = avgMetrics.get(nodeId);
    if (node && avg) {
      cascadingEffects.push(
        `${node.label} was impacted: avg latency ${avg.latency.toFixed(0)}ms, error rate ${avg.errorRate.toFixed(1)}%.`
      );
    }
  }

  if (cascadingEffects.length === 0) {
    cascadingEffects.push('No significant cascading effects were detected.');
  }

  // Build summary
  const summary = [
    `Analysis of ${architecture.name} simulation with ${failures.length} injected failure(s).`,
    `Detected ${errorLogs.length} errors and ${warnLogs.length} warnings across ${architecture.nodes.length} services.`,
    failedNodes.length > 0
      ? `Primary impact on: ${failedNodes.map((n) => n.label).join(', ')}.`
      : 'No direct service failures detected.',
    degradedNodes.length > 0
      ? `${degradedNodes.length} additional service(s) experienced cascading degradation.`
      : '',
  ]
    .filter(Boolean)
    .join(' ');

  recommendations.push('Consider implementing distributed tracing with OpenTelemetry for faster root cause identification.');
  recommendations.push('Set up automated alerting for error rate thresholds above 5%.');

  return {
    summary,
    rootCause: rootCauses.join(' ') || 'No failures were injected during this simulation.',
    cascadingEffects,
    recommendations,
    timeline,
  };
}

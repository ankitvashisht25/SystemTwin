import type { Architecture, ArchitectureNode } from '@systemtwin/shared';
import { scoreArchitecture } from './architectureScorer.js';
import { estimateArchitectureCost } from './costEstimator.js';

interface ComparisonResult {
  left: ArchitectureSummary;
  right: ArchitectureSummary;
  diff: {
    nodesAdded: string[];
    nodesRemoved: string[];
    nodesModified: string[];
    edgesAdded: string[];
    edgesRemoved: string[];
    scoreChange: { category: string; leftScore: number; rightScore: number; change: number }[];
    costChange: { leftCost: number; rightCost: number; change: number; changePercent: string };
  };
}

interface ArchitectureSummary {
  name: string;
  nodeCount: number;
  edgeCount: number;
  categories: Record<string, number>;
  score: { overall: string; overallNumeric: number };
  monthlyCost: number;
}

export function compareArchitectures(left: Architecture, right: Architecture): ComparisonResult {
  const leftScore = scoreArchitecture(left);
  const rightScore = scoreArchitecture(right);
  const leftCost = estimateArchitectureCost(left);
  const rightCost = estimateArchitectureCost(right);

  // Node diff by label (since IDs may differ between architectures)
  const leftLabels = new Set(left.nodes.map(n => n.label));
  const rightLabels = new Set(right.nodes.map(n => n.label));

  const nodesAdded = right.nodes.filter(n => !leftLabels.has(n.label)).map(n => n.label);
  const nodesRemoved = left.nodes.filter(n => !rightLabels.has(n.label)).map(n => n.label);

  const nodesModified: string[] = [];
  for (const rNode of right.nodes) {
    const lNode = left.nodes.find(n => n.label === rNode.label);
    if (lNode && (lNode.type !== rNode.type || JSON.stringify(lNode.config) !== JSON.stringify(rNode.config))) {
      nodesModified.push(rNode.label);
    }
  }

  // Edge diff
  const leftEdgeKeys = new Set(left.edges.map(e => {
    const src = left.nodes.find(n => n.id === e.source)?.label || e.source;
    const tgt = left.nodes.find(n => n.id === e.target)?.label || e.target;
    return `${src}->${tgt}`;
  }));
  const rightEdgeKeys = new Set(right.edges.map(e => {
    const src = right.nodes.find(n => n.id === e.source)?.label || e.source;
    const tgt = right.nodes.find(n => n.id === e.target)?.label || e.target;
    return `${src}->${tgt}`;
  }));

  const edgesAdded = [...rightEdgeKeys].filter(k => !leftEdgeKeys.has(k));
  const edgesRemoved = [...leftEdgeKeys].filter(k => !rightEdgeKeys.has(k));

  // Score comparison
  const scoreCategories = ['resilience', 'costEfficiency', 'scalability', 'security', 'complexity'] as const;
  const scoreChange = scoreCategories.map(cat => ({
    category: cat,
    leftScore: leftScore.categories[cat].score,
    rightScore: rightScore.categories[cat].score,
    change: rightScore.categories[cat].score - leftScore.categories[cat].score,
  }));

  const catCount = (nodes: ArchitectureNode[]) => {
    const counts: Record<string, number> = {};
    nodes.forEach(n => { counts[n.category] = (counts[n.category] || 0) + 1; });
    return counts;
  };

  return {
    left: {
      name: left.name, nodeCount: left.nodes.length, edgeCount: left.edges.length,
      categories: catCount(left.nodes), score: { overall: leftScore.overall, overallNumeric: leftScore.overallNumeric },
      monthlyCost: leftCost.totalMonthlyCost,
    },
    right: {
      name: right.name, nodeCount: right.nodes.length, edgeCount: right.edges.length,
      categories: catCount(right.nodes), score: { overall: rightScore.overall, overallNumeric: rightScore.overallNumeric },
      monthlyCost: rightCost.totalMonthlyCost,
    },
    diff: {
      nodesAdded, nodesRemoved, nodesModified, edgesAdded, edgesRemoved,
      scoreChange,
      costChange: {
        leftCost: leftCost.totalMonthlyCost,
        rightCost: rightCost.totalMonthlyCost,
        change: Math.round((rightCost.totalMonthlyCost - leftCost.totalMonthlyCost) * 100) / 100,
        changePercent: leftCost.totalMonthlyCost > 0
          ? `${((rightCost.totalMonthlyCost - leftCost.totalMonthlyCost) / leftCost.totalMonthlyCost * 100).toFixed(1)}%`
          : 'N/A',
      },
    },
  };
}

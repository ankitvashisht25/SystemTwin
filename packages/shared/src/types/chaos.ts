import type { FailureType } from './simulation.js';
import type { ComponentType, NodeCategory } from './architecture.js';

export interface ChaosScenario {
  id: string;
  name: string;
  description: string;
  category: 'availability' | 'performance' | 'network';
  steps: ChaosStep[];
}

export interface ChaosStep {
  delayTicks: number;
  action: 'inject' | 'remove';
  targetSelector: ChaosTargetSelector;
  failureType: FailureType;
}

export interface ChaosTargetSelector {
  nodeId?: string;
  nodeType?: ComponentType;
  category?: NodeCategory;
  random?: boolean;
}

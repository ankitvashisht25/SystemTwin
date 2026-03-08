import type { ComponentType } from './architecture.js';

export interface CostEstimate {
  nodeId: string;
  componentType: ComponentType;
  service: string;
  monthlyCost: number;
  breakdown: CostLineItem[];
}

export interface CostLineItem {
  resource: string;
  quantity: number;
  unitPrice: number;
  monthlyCost: number;
}

export interface ArchitectureCost {
  totalMonthlyCost: number;
  nodes: CostEstimate[];
  projections: CostProjection[];
}

export interface CostProjection {
  scale: number;
  label: string;
  monthlyCost: number;
}

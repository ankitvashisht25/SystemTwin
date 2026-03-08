import type { SimulationConfig, SimulationTick } from './simulation.js';

export interface SimulationRecording {
  id: string;
  architectureId?: string;
  userId: string;
  name: string;
  config: SimulationConfig;
  tickCount: number;
  ticks: SimulationTick[];
  createdAt: string;
}

export type ReplayState = 'idle' | 'playing' | 'paused';

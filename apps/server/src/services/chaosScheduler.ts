import type { ChaosScenario, ChaosStep, ChaosTargetSelector } from '@systemtwin/shared';
import type { Architecture, FailureType } from '@systemtwin/shared';
import type { SimulationEngine } from './simulationEngine.js';

export class ChaosScheduler {
  private engine: SimulationEngine;
  private scenario: ChaosScenario | null = null;
  private architecture: Architecture | null = null;
  private executedSteps = new Set<number>();

  constructor(engine: SimulationEngine) {
    this.engine = engine;
  }

  startScenario(scenario: ChaosScenario, architecture: Architecture) {
    this.scenario = scenario;
    this.architecture = architecture;
    this.executedSteps.clear();
  }

  stop() {
    this.scenario = null;
    this.architecture = null;
    this.executedSteps.clear();
  }

  onTick(tick: number) {
    if (!this.scenario || !this.architecture) return;

    for (let i = 0; i < this.scenario.steps.length; i++) {
      const step = this.scenario.steps[i];
      if (step.delayTicks === tick && !this.executedSteps.has(i)) {
        this.executedSteps.add(i);
        this.executeStep(step);
      }
    }
  }

  private executeStep(step: ChaosStep) {
    if (!this.architecture) return;
    const nodeIds = this.resolveTargets(step.targetSelector);

    if (step.action === 'inject') {
      for (const nodeId of nodeIds) {
        this.engine.injectFailure(nodeId, step.failureType);
      }
    } else {
      // Remove all failures matching the type for target nodes
      const status = this.engine.getStatus();
      for (const failure of status.failures) {
        if (nodeIds.includes(failure.nodeId) && failure.type === step.failureType) {
          this.engine.removeFailure(failure.id);
        }
      }
    }
  }

  private resolveTargets(selector: ChaosTargetSelector): string[] {
    if (!this.architecture) return [];

    let candidates = this.architecture.nodes;

    if (selector.nodeId) return [selector.nodeId];
    if (selector.nodeType) candidates = candidates.filter((n) => n.type === selector.nodeType);
    if (selector.category) candidates = candidates.filter((n) => n.category === selector.category);

    if (selector.random && candidates.length > 0) {
      return [candidates[Math.floor(Math.random() * candidates.length)].id];
    }

    return candidates.map((n) => n.id);
  }
}

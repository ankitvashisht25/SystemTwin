import type { ChaosScenario } from '../types/chaos.js';

export const chaosScenarios: ChaosScenario[] = [
  {
    id: 'region-outage',
    name: 'Region Outage',
    description: 'Simulates a region-level outage by crashing all database and cache nodes',
    category: 'availability',
    steps: [
      { delayTicks: 5, action: 'inject', targetSelector: { category: 'database' }, failureType: 'crash' },
      { delayTicks: 15, action: 'inject', targetSelector: { category: 'cache' }, failureType: 'crash' },
      { delayTicks: 40, action: 'remove', targetSelector: { category: 'database' }, failureType: 'crash' },
      { delayTicks: 45, action: 'remove', targetSelector: { category: 'cache' }, failureType: 'crash' },
    ],
  },
  {
    id: 'cascade-test',
    name: 'Cascade Test',
    description: 'Progressively degrades a backend service to test cascading failure propagation',
    category: 'availability',
    steps: [
      { delayTicks: 5, action: 'inject', targetSelector: { category: 'backend', random: true }, failureType: 'latency' },
      { delayTicks: 15, action: 'inject', targetSelector: { category: 'backend', random: true }, failureType: 'crash' },
      { delayTicks: 35, action: 'remove', targetSelector: { category: 'backend' }, failureType: 'crash' },
      { delayTicks: 40, action: 'remove', targetSelector: { category: 'backend' }, failureType: 'latency' },
    ],
  },
  {
    id: 'load-spike',
    name: 'Load Spike',
    description: 'Simulates resource exhaustion across all backend services simultaneously',
    category: 'performance',
    steps: [
      { delayTicks: 5, action: 'inject', targetSelector: { category: 'backend' }, failureType: 'resource-exhaustion' },
      { delayTicks: 25, action: 'remove', targetSelector: { category: 'backend' }, failureType: 'resource-exhaustion' },
    ],
  },
  {
    id: 'network-partition',
    name: 'Network Partition',
    description: 'Isolates database and cache nodes via network partition',
    category: 'network',
    steps: [
      { delayTicks: 5, action: 'inject', targetSelector: { category: 'database', random: true }, failureType: 'partition' },
      { delayTicks: 10, action: 'inject', targetSelector: { category: 'cache', random: true }, failureType: 'partition' },
      { delayTicks: 25, action: 'remove', targetSelector: { category: 'database' }, failureType: 'partition' },
      { delayTicks: 30, action: 'remove', targetSelector: { category: 'cache' }, failureType: 'partition' },
    ],
  },
];

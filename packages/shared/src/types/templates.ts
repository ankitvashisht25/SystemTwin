import type { ArchitectureNode, ArchitectureEdge } from './architecture';

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  category: 'microservices' | 'serverless' | 'monolith' | 'event-driven' | 'data-pipeline' | 'real-time' | 'e-commerce' | 'saas';
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

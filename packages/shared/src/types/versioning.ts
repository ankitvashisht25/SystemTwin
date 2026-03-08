import type { ArchitectureNode, ArchitectureEdge } from './architecture';

export interface ArchitectureVersion {
  id: string;
  architectureId: string;
  versionNumber: number;
  name: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface VersionDiff {
  added: { nodes: string[]; edges: string[] };
  removed: { nodes: string[]; edges: string[] };
  modified: { nodes: string[]; edges: string[] };
}

import type { Node, Edge } from '@xyflow/react';
import type { FlowNodeData } from '../stores/architectureStore';

interface Snapshot {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
}

const past: Snapshot[] = [];
const future: Snapshot[] = [];
const MAX_HISTORY = 50;

export function saveSnapshot(nodes: Node<FlowNodeData>[], edges: Edge[]) {
  past.push(JSON.parse(JSON.stringify({ nodes, edges })));
  if (past.length > MAX_HISTORY) past.shift();
  future.length = 0;
}

export function undo(): Snapshot | null {
  if (past.length === 0) return null;
  return past.pop()!;
}

export function redo(): Snapshot | null {
  if (future.length === 0) return null;
  return future.pop()!;
}

export function pushToFuture(nodes: Node<FlowNodeData>[], edges: Edge[]) {
  future.push(JSON.parse(JSON.stringify({ nodes, edges })));
}

export function pushToPast(nodes: Node<FlowNodeData>[], edges: Edge[]) {
  past.push(JSON.parse(JSON.stringify({ nodes, edges })));
  if (past.length > MAX_HISTORY) past.shift();
}

export function canUndo() {
  return past.length > 0;
}

export function canRedo() {
  return future.length > 0;
}

export function clearHistory() {
  past.length = 0;
  future.length = 0;
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Node, Edge, Connection, OnNodesChange, OnEdgesChange } from '@xyflow/react';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { ArchitectureNode, NodeStatus } from '@systemtwin/shared';
import { saveSnapshot } from '../lib/undoRedo';

export interface FlowNodeData extends Record<string, unknown> {
  label: string;
  componentType: string;
  category: string;
  config: Record<string, unknown>;
  status: NodeStatus;
  icon: string;
}

interface ArchitectureState {
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  onNodesChange: OnNodesChange<Node<FlowNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (node: Node<FlowNodeData>) => void;
  removeNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeConfig: (id: string, config: Record<string, unknown>) => void;
  updateNodeStatus: (id: string, status: NodeStatus) => void;
  updateAllStatuses: (statuses: Array<{ nodeId: string; status: NodeStatus }>) => void;
  getArchitectureData: () => { nodes: ArchitectureNode[]; edges: Array<{ id: string; source: string; target: string }> };
  loadArchitecture: (nodes: Node<FlowNodeData>[], edges: Edge[]) => void;
  clearCanvas: () => void;
}

export const useArchitectureStore = create<ArchitectureState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,

      onNodesChange: (changes) => {
        set({ nodes: applyNodeChanges(changes, get().nodes) });
      },

      onEdgesChange: (changes) => {
        set({ edges: applyEdgeChanges(changes, get().edges) });
      },

      onConnect: (connection) => {
        saveSnapshot(get().nodes, get().edges);
        set({ edges: addEdge({ ...connection, type: 'animated', animated: true }, get().edges) });
      },

      addNode: (node) => {
        saveSnapshot(get().nodes, get().edges);
        set({ nodes: [...get().nodes, node] });
      },

      removeNode: (id) => {
        saveSnapshot(get().nodes, get().edges);
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: get().selectedNodeId === id ? null : get().selectedNodeId,
        });
      },

      setSelectedNode: (id) => set({ selectedNodeId: id }),

      updateNodeLabel: (id, label) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, label } } : n
          ),
        });
      },

      updateNodeConfig: (id, config) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n
          ),
        });
      },

      updateNodeStatus: (id, status) => {
        set({
          nodes: get().nodes.map((n) =>
            n.id === id ? { ...n, data: { ...n.data, status } } : n
          ),
        });
      },

      updateAllStatuses: (statuses) => {
        const statusMap = new Map(statuses.map((s) => [s.nodeId, s.status]));
        set({
          nodes: get().nodes.map((n) => {
            const newStatus = statusMap.get(n.id);
            return newStatus ? { ...n, data: { ...n.data, status: newStatus } } : n;
          }),
        });
      },

      getArchitectureData: () => {
        const { nodes, edges } = get();
        return {
          nodes: nodes.map((n) => ({
            id: n.id,
            type: n.data.componentType as ArchitectureNode['type'],
            category: n.data.category as ArchitectureNode['category'],
            label: n.data.label,
            position: n.position,
            config: n.data.config,
            status: n.data.status,
          })),
          edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
        };
      },

      loadArchitecture: (nodes, edges) => set({ nodes, edges, selectedNodeId: null }),

      clearCanvas: () => {
        saveSnapshot(get().nodes, get().edges);
        set({ nodes: [], edges: [], selectedNodeId: null });
      },
    }),
    {
      name: 'systemtwin-architecture',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        nodes: state.nodes.map((n) => ({
          ...n,
          data: { ...n.data, status: 'healthy' as const },
          selected: false,
        })),
        edges: state.edges,
      }),
    }
  )
);

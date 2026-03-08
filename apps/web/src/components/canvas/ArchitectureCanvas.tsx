import { useCallback, useRef, type DragEvent } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import BaseNode from './nodes/BaseNode';
import AnimatedEdge from './edges/AnimatedEdge';
import CanvasSearch from './CanvasSearch';
import CollaboratorCursors from './CollaboratorCursors';
import { useArchitectureStore, type FlowNodeData } from '../../stores/architectureStore';
import { useUIStore } from '../../stores/uiStore';
import { useCollaboration } from '../../hooks/useCollaboration';
import type { ComponentDefinition } from '@systemtwin/shared';

const nodeTypes = {
  frontend: BaseNode,
  backend: BaseNode,
  database: BaseNode,
  cache: BaseNode,
  queue: BaseNode,
  infrastructure: BaseNode,
  aws: BaseNode,
  azure: BaseNode,
  gcp: BaseNode,
};

const edgeTypes = {
  animated: AnimatedEdge,
};

const defaultEdgeOptions = {
  type: 'animated',
  animated: true,
};

let nodeCounter = 0;

export default function ArchitectureCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode, setSelectedNode } =
    useArchitectureStore();
  const { broadcastCursorMove } = useCollaboration();

  const lastCursorRef = useRef(0);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastCursorRef.current < 50) return;
    lastCursorRef.current = now;
    broadcastCursorMove(e.clientX, e.clientY);
  }, [broadcastCursorMove]);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/systemtwin-component');
      if (!raw) return;

      const component: ComponentDefinition = JSON.parse(raw);
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      nodeCounter++;
      const newNode: Node<FlowNodeData> = {
        id: `${component.type}-${nodeCounter}-${Date.now()}`,
        type: component.category,
        position,
        data: {
          label: component.label,
          componentType: component.type,
          category: component.category,
          config: { ...component.defaultConfig },
          status: 'healthy',
          icon: component.icon,
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
      // Auto-open right sidebar to show config panel
      if (!useUIStore.getState().rightSidebarOpen) {
        useUIStore.getState().toggleRightSidebar();
      }
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full" onMouseMove={handleMouseMove}>
      <CollaboratorCursors />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <CanvasSearch />
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1e293b" />
        <Controls />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            const data = n.data as FlowNodeData;
            if (data.status === 'failed') return '#ef4444';
            if (data.status === 'degraded') return '#f59e0b';
            return '#10b981';
          }}
          maskColor="#0a0e1780"
        />
      </ReactFlow>
    </div>
  );
}

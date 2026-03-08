import { useState, useEffect } from 'react';
import { X, FolderOpen, Clock, Trash2, Plus, FileCode } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useArchitectureStore, type FlowNodeData } from '../../stores/architectureStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Node, Edge } from '@xyflow/react';

interface SavedArch {
  id: string;
  name: string;
  nodes: any[];
  edges: any[];
  updatedAt: string;
}

export default function SavedArchitectures({ onClose }: { onClose: () => void }) {
  const [architectures, setArchitectures] = useState<SavedArch[]>([]);
  const [loading, setLoading] = useState(true);
  const { loadArchitecture, clearCanvas } = useArchitectureStore();
  const { setArchitectureName, setProjectId } = useProjectStore();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/architecture');
      if (res.ok) setArchitectures(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleLoad = (arch: SavedArch) => {
    const flowNodes: Node<FlowNodeData>[] = arch.nodes.map((n: any) => ({
      id: n.id,
      type: n.category,
      position: n.position,
      data: {
        label: n.label,
        componentType: n.type,
        category: n.category,
        config: n.config,
        status: 'healthy' as const,
        icon: '',
      },
    }));
    const flowEdges: Edge[] = arch.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'animated',
      animated: true,
    }));
    loadArchitecture(flowNodes, flowEdges);
    setArchitectureName(arch.name);
    setProjectId(arch.id);
    onClose();
  };

  const handleDelete = async (id: string) => {
    await apiFetch(`/api/architecture/${id}`, { method: 'DELETE' });
    setArchitectures((prev) => prev.filter((a) => a.id !== id));
  };

  const handleNew = () => {
    clearCanvas();
    setArchitectureName('Untitled Architecture');
    setProjectId('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800 border border-border rounded-xl w-[560px] max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <FolderOpen size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold text-white">My Architectures</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/15 transition-colors"
            >
              <Plus size={12} />
              New
            </button>
            <button onClick={onClose} className="p-1 hover:bg-surface-600 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-gray-600 text-xs">Loading...</div>
          ) : architectures.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <FileCode size={28} className="mb-2 opacity-30" />
              <p className="text-xs">No saved architectures yet</p>
              <p className="text-[10px] mt-1 text-gray-700">Design your first one and hit Save</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {architectures.map((arch) => (
                <div
                  key={arch.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-700 cursor-pointer transition-colors group"
                  onClick={() => handleLoad(arch)}
                >
                  <div className="w-9 h-9 rounded-lg bg-surface-600 flex items-center justify-center flex-shrink-0">
                    <FileCode size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 font-medium truncate">{arch.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-gray-600">{arch.nodes.length} nodes</span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-600">
                        <Clock size={9} />
                        {new Date(arch.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(arch.id); }}
                    className="p-1.5 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

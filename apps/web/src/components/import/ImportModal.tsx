import { useState, useRef } from 'react';
import { X, Upload, FileJson, Check, AlertCircle } from 'lucide-react';
import { useArchitectureStore, type FlowNodeData } from '../../stores/architectureStore';
import { useProjectStore } from '../../stores/projectStore';
import { componentLibrary } from '@systemtwin/shared';
import type { Architecture } from '@systemtwin/shared';
import type { Node, Edge } from '@xyflow/react';

interface Props {
  onClose: () => void;
}

export default function ImportModal({ onClose }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ name: string; nodeCount: number; edgeCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsedArch, setParsedArch] = useState<Architecture | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadArchitecture = useArchitectureStore((s) => s.loadArchitecture);

  const handleFile = (f: File) => {
    setFile(f);
    setError(null);
    setPreview(null);
    setParsedArch(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);

        // Validate structure
        if (!json.nodes || !Array.isArray(json.nodes)) {
          setError('Invalid architecture: missing nodes array');
          return;
        }
        if (!json.edges || !Array.isArray(json.edges)) {
          setError('Invalid architecture: missing edges array');
          return;
        }

        const arch: Architecture = {
          id: json.id || crypto.randomUUID(),
          name: json.name || f.name.replace('.json', ''),
          nodes: json.nodes,
          edges: json.edges,
          createdAt: json.createdAt || new Date().toISOString(),
          updatedAt: json.updatedAt || new Date().toISOString(),
        };

        setParsedArch(arch);
        setPreview({ name: arch.name, nodeCount: arch.nodes.length, edgeCount: arch.edges.length });
      } catch {
        setError('Failed to parse JSON file');
      }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.json')) handleFile(f);
    else setError('Please drop a .json file');
  };

  const handleImport = () => {
    if (!parsedArch) return;

    // Transform ArchitectureNode[] to ReactFlow Node<FlowNodeData>[]
    const flowNodes: Node<FlowNodeData>[] = parsedArch.nodes.map((n) => {
      const def = componentLibrary.find((c) => c.type === n.type);
      return {
        id: n.id,
        type: n.category,
        position: n.position,
        data: {
          label: n.label,
          componentType: n.type,
          category: n.category,
          config: n.config,
          status: 'healthy' as const,
          icon: def?.icon || 'Box',
        },
      };
    });

    const flowEdges: Edge[] = parsedArch.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'animated',
      animated: true,
      label: e.label,
    }));

    loadArchitecture(flowNodes, flowEdges);
    useProjectStore.getState().setArchitectureName(parsedArch.name);
    useProjectStore.getState().setProjectId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800 border border-border rounded-xl w-[480px] max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-accent-cyan" />
            <span className="text-sm font-semibold text-white">Import Architecture</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-600 rounded transition-colors">
            <X size={16} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent-cyan/50 transition-colors"
          >
            <Upload size={32} className="mx-auto text-gray-500 mb-3" />
            <p className="text-sm text-gray-400">Drop a JSON file here or click to browse</p>
            <p className="text-xs text-gray-600 mt-1">Accepts .json architecture files</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 p-2.5 rounded-lg">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="bg-surface-700 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <FileJson size={16} className="text-accent-cyan" />
                <span className="text-sm text-white font-medium">{preview.name}</span>
              </div>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>{preview.nodeCount} nodes</span>
                <span>{preview.edgeCount} edges</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!parsedArch}
            className="px-3 py-1.5 text-xs bg-accent-cyan text-white rounded hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
          >
            <Check size={12} /> Import
          </button>
        </div>
      </div>
    </div>
  );
}

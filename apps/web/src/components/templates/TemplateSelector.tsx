import { useState, useEffect } from 'react';
import { X, LayoutTemplate, Server, Box, Layers } from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { componentLibrary } from '@systemtwin/shared';
import { useArchitectureStore, type FlowNodeData } from '../../stores/architectureStore';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import type { Node, Edge } from '@xyflow/react';

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  nodeCount: number;
  edgeCount: number;
}

interface TemplateDetail {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: Array<{
    id: string;
    type: string;
    category: string;
    label: string;
    position: { x: number; y: number };
    config: Record<string, unknown>;
    status: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

const categoryIcons: Record<string, React.ComponentType<any>> = {
  microservices: Layers,
  serverless: Server,
  monolith: Box,
  'event-driven': LayoutTemplate,
};

const categoryColors: Record<string, string> = {
  microservices: '#8b5cf6',
  serverless: '#3b82f6',
  monolith: '#f59e0b',
  'event-driven': '#ec4899',
};

export default function TemplateSelector({ onClose }: { onClose: () => void }) {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const { loadArchitecture } = useArchitectureStore();
  const { setArchitectureName, setProjectId } = useProjectStore();

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/templates');
        if (res.ok) {
          setTemplates(await res.json());
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  const handleSelect = async (templateId: string) => {
    setApplying(templateId);
    try {
      const res = await apiFetch(`/api/templates/${templateId}`);
      if (!res.ok) return;

      const template: TemplateDetail = await res.json();

      const flowNodes: Node<FlowNodeData>[] = template.nodes.map((n) => {
        const compDef = componentLibrary.find((c) => c.type === n.type);
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
            icon: compDef?.icon || '',
          },
        };
      });

      const flowEdges: Edge[] = template.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'animated',
        animated: true,
      }));

      loadArchitecture(flowNodes, flowEdges);
      setArchitectureName(template.name);
      setProjectId('');
      onClose();
    } catch { /* ignore */ }
    setApplying(null);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-800 border border-border rounded-xl w-[640px] max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={16} className="text-accent-cyan" />
            <span className="text-sm font-semibold text-white">Architecture Templates</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-surface-600 rounded transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-gray-600 text-xs">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600">
              <LayoutTemplate size={28} className="mb-2 opacity-30" />
              <p className="text-xs">No templates available</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {templates.map((tpl) => {
                const Icon = categoryIcons[tpl.category] || LayoutTemplate;
                const color = categoryColors[tpl.category] || '#6366f1';
                const isApplying = applying === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => !applying && handleSelect(tpl.id)}
                    className={`relative flex flex-col gap-2.5 p-4 rounded-lg border border-border hover:border-gray-600 bg-surface-700 hover:bg-surface-600 cursor-pointer transition-all group ${isApplying ? 'opacity-60 pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
                          {tpl.name}
                        </p>
                        <span
                          className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5"
                          style={{ backgroundColor: `${color}20`, color }}
                        >
                          {tpl.category}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      {tpl.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-gray-600">
                      <span>{tpl.nodeCount} nodes</span>
                      <span>{tpl.edgeCount} connections</span>
                    </div>
                    {isApplying && (
                      <div className="absolute inset-0 flex items-center justify-center bg-surface-700/80 rounded-lg">
                        <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

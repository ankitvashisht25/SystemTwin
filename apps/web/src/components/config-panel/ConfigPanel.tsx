import { useMemo } from 'react';
import { Settings, X } from 'lucide-react';
import { useArchitectureStore } from '../../stores/architectureStore';
import { componentLibrary } from '@systemtwin/shared';
import type { ConfigField } from '@systemtwin/shared';

export default function ConfigPanel() {
  const { nodes, selectedNodeId, updateNodeLabel, updateNodeConfig, removeNode, setSelectedNode } = useArchitectureStore();

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const componentDef = useMemo(
    () => selectedNode ? componentLibrary.find((c) => c.type === selectedNode.data.componentType) : null,
    [selectedNode]
  );

  if (!selectedNode) {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center text-gray-500">
        <Settings size={32} className="mb-3 opacity-30" />
        <p className="text-sm">Select a component to configure</p>
        <p className="text-xs mt-1 opacity-60">Click a node on the canvas</p>
      </div>
    );
  }

  const config = selectedNode.data.config || {};

  const handleChange = (key: string, value: unknown) => {
    updateNodeConfig(selectedNode.id, { [key]: value });
  };

  // Build config fields: use componentDef schema if available, otherwise generate from config keys
  const configFields: ConfigField[] = componentDef?.configSchema || Object.keys(config).map((key) => {
    const val = config[key];
    let type: 'text' | 'number' | 'boolean' | 'select' = 'text';
    if (typeof val === 'number') type = 'number';
    else if (typeof val === 'boolean') type = 'boolean';
    return { key, label: key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()), type, defaultValue: val };
  });

  return (
    <div className="p-4 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 mr-2">
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(e) => updateNodeLabel(selectedNode.id, e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-white border-b border-transparent hover:border-border focus:border-accent-blue focus:outline-none pb-0.5"
          />
          <p className="text-xs text-gray-500 capitalize mt-0.5">
            {selectedNode.data.componentType.replace(/-/g, ' ')}
          </p>
        </div>
        <button
          onClick={() => setSelectedNode(null)}
          className="p-1 hover:bg-surface-600 rounded transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Status badge */}
      <div className="mb-4">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
            ${selectedNode.data.status === 'healthy' ? 'bg-green-500/15 text-green-400' : ''}
            ${selectedNode.data.status === 'degraded' ? 'bg-yellow-500/15 text-yellow-400' : ''}
            ${selectedNode.data.status === 'failed' ? 'bg-red-500/15 text-red-400' : ''}
            ${selectedNode.data.status === 'offline' ? 'bg-gray-500/15 text-gray-400' : ''}
          `}
        >
          <span className={`w-1.5 h-1.5 rounded-full
            ${selectedNode.data.status === 'healthy' ? 'bg-green-400' : ''}
            ${selectedNode.data.status === 'degraded' ? 'bg-yellow-400' : ''}
            ${selectedNode.data.status === 'failed' ? 'bg-red-400' : ''}
            ${selectedNode.data.status === 'offline' ? 'bg-gray-400' : ''}
          `} />
          {selectedNode.data.status}
        </span>
      </div>

      {/* Config fields */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Configuration</h4>
        {configFields.map((field: ConfigField) => (
          <div key={field.key}>
            <label className="block text-xs text-gray-400 mb-1">
              {field.label}
              {field.unit && <span className="text-gray-600 ml-1">({field.unit})</span>}
            </label>
            {field.type === 'select' ? (
              <select
                className="w-full bg-surface-700 border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent-blue"
                value={(config[field.key] as string) ?? field.defaultValue}
                onChange={(e) => handleChange(field.key, e.target.value)}
              >
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'boolean' ? (
              <button
                onClick={() => handleChange(field.key, !config[field.key])}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  config[field.key] ? 'bg-accent-green' : 'bg-surface-600'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    config[field.key] ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                className="w-full bg-surface-700 border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-accent-blue"
                value={(config[field.key] as string | number) ?? field.defaultValue}
                onChange={(e) =>
                  handleChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)
                }
              />
            )}
          </div>
        ))}
      </div>

      {/* Node ID */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-[10px] text-gray-600 font-mono break-all">{selectedNode.id}</p>
      </div>

      {/* Delete button */}
      <button
        onClick={() => removeNode(selectedNode.id)}
        className="mt-3 w-full py-1.5 rounded text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
      >
        Remove Component
      </button>
    </div>
  );
}

import { useState } from 'react';
import { Zap, X, Trash2, Flame, Clock, Unplug, Cpu, AlertCircle } from 'lucide-react';
import { useArchitectureStore } from '../../stores/architectureStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useSimulationActions } from '../../hooks/useSimulation';
import { useUIStore } from '../../stores/uiStore';
import type { FailureType } from '@systemtwin/shared';

const failureTypes: Array<{ type: FailureType; label: string; icon: React.ComponentType<any>; color: string; description: string }> = [
  { type: 'crash', label: 'Service Crash', icon: Flame, color: '#ef4444', description: 'Kill the service completely' },
  { type: 'latency', label: 'Network Latency', icon: Clock, color: '#f59e0b', description: 'Add 500ms delay' },
  { type: 'partition', label: 'Network Partition', icon: Unplug, color: '#ec4899', description: 'Disconnect from network' },
  { type: 'resource-exhaustion', label: 'Resource Exhaustion', icon: Cpu, color: '#8b5cf6', description: 'Max out CPU/Memory' },
];

export default function ChaosPanel() {
  const nodes = useArchitectureStore((s) => s.nodes);
  const failures = useSimulationStore((s) => s.failures);
  const simStatus = useSimulationStore((s) => s.status);
  const { injectFailure, removeFailure } = useSimulationActions();
  const setShowChaosPanel = useUIStore((s) => s.setShowChaosPanel);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedType, setSelectedType] = useState<FailureType>('crash');
  const [injecting, setInjecting] = useState(false);

  const isRunning = simStatus === 'running';
  const canInject = !!selectedTarget && isRunning;

  const handleInject = async () => {
    if (!canInject || injecting) return;
    setInjecting(true);
    try {
      await injectFailure(selectedTarget, selectedType);
    } catch { /* handled by server */ }
    setInjecting(false);
  };

  // Stop propagation on the entire panel so React Flow doesn't steal events
  const stopProp = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="w-72 bg-surface-800 border border-border rounded-xl shadow-2xl overflow-hidden"
      onMouseDown={stopProp}
      onPointerDown={stopProp}
      onClick={stopProp}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-red-500/5">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-red-400" />
          <span className="text-xs font-semibold text-red-400">Chaos Engineering</span>
        </div>
        <button onClick={() => setShowChaosPanel(false)} className="p-1 hover:bg-surface-600 rounded">
          <X size={12} />
        </button>
      </div>

      <div className="p-3 space-y-3">
        {/* Warning if simulation not running */}
        {!isRunning && (
          <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
            <AlertCircle size={12} className="text-yellow-400 flex-shrink-0" />
            <span className="text-[10px] text-yellow-400">Start a simulation first to inject failures</span>
          </div>
        )}

        {/* Target selector */}
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Target Service</label>
          <select
            className="w-full bg-surface-700 border border-border rounded px-2.5 py-1.5 text-xs focus:outline-none focus:border-red-400"
            value={selectedTarget}
            onChange={(e) => setSelectedTarget(e.target.value)}
          >
            <option value="">Select a service...</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>{n.data.label}</option>
            ))}
          </select>
        </div>

        {/* Failure type */}
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Failure Type</label>
          <div className="space-y-1">
            {failureTypes.map((ft) => (
              <button
                key={ft.type}
                onClick={() => setSelectedType(ft.type)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  selectedType === ft.type
                    ? 'bg-surface-600 border border-border'
                    : 'hover:bg-surface-700 border border-transparent'
                }`}
              >
                <ft.icon size={13} style={{ color: ft.color }} />
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-200">{ft.label}</p>
                  <p className="text-[10px] text-gray-500">{ft.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Inject button */}
        <button
          onClick={handleInject}
          disabled={!canInject || injecting}
          className="w-full py-2.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {injecting ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap size={12} />
          )}
          {!isRunning ? 'Simulation Not Running' : !selectedTarget ? 'Select a Service' : injecting ? 'Injecting...' : 'Inject Failure'}
        </button>

        {/* Active failures */}
        {failures.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-500 mb-1.5">Active Failures ({failures.length})</h4>
            <div className="space-y-1">
              {failures.map((f) => {
                const node = nodes.find((n) => n.id === f.nodeId);
                const ft = failureTypes.find((t) => t.type === f.type);
                return (
                  <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 bg-red-500/5 rounded border border-red-500/10">
                    <span className="text-xs text-red-400 flex-1 truncate">
                      {node?.data.label || f.nodeId} — {ft?.label}
                    </span>
                    <button
                      onClick={() => removeFailure(f.id)}
                      className="p-0.5 hover:bg-red-500/20 rounded"
                    >
                      <Trash2 size={11} className="text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { X, Zap, TrendingUp, Activity, Waves, Clock, Users, Settings2 } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';

interface Props {
  onClose: () => void;
  onStart: () => void;
}

const patterns = [
  { id: 'steady' as const, label: 'Steady', icon: Activity, desc: 'Constant load with \u00b15% random variation', color: '#10b981' },
  { id: 'ramp' as const, label: 'Ramp Up', icon: TrendingUp, desc: 'Linear increase from 10% to 100% over 30 ticks', color: '#3b82f6' },
  { id: 'spike' as const, label: 'Spike', icon: Zap, desc: '3x traffic bursts every 20 ticks', color: '#f59e0b' },
  { id: 'wave' as const, label: 'Wave', icon: Waves, desc: 'Sinusoidal oscillation with 50% amplitude', color: '#8b5cf6' },
];

export default function SimulationConfigPanel({ onClose, onStart }: Props) {
  const trafficLevel = useSimulationStore((s) => s.trafficLevel);
  const trafficPattern = useSimulationStore((s) => s.trafficPattern);
  const tickRate = useSimulationStore((s) => s.tickRate);
  const duration = useSimulationStore((s) => s.duration);
  const setTrafficLevel = useSimulationStore((s) => s.setTrafficLevel);
  const setTrafficPattern = useSimulationStore((s) => s.setTrafficPattern);
  const setTickRate = useSimulationStore((s) => s.setTickRate);
  const setDuration = useSimulationStore((s) => s.setDuration);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 border border-border rounded-lg w-[520px] max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 size={16} className="text-accent-blue" />
            <h2 className="text-sm font-semibold text-white">Simulation Configuration</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto max-h-[65vh]">
          {/* Traffic Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Users size={12} /> Traffic Level
              </label>
              <span className="text-xs font-mono text-accent-cyan">{trafficLevel.toLocaleString()} users</span>
            </div>
            <input
              type="range" min={10} max={50000} step={10} value={trafficLevel}
              onChange={(e) => setTrafficLevel(Number(e.target.value))}
              className="w-full h-1.5 bg-surface-600 rounded-lg appearance-none cursor-pointer accent-accent-blue"
            />
            <div className="flex justify-between text-[9px] text-gray-600 mt-1">
              <span>10</span><span>1K</span><span>10K</span><span>50K</span>
            </div>
          </div>

          {/* Traffic Pattern */}
          <div>
            <label className="text-xs font-semibold text-gray-400 mb-2 block">Traffic Pattern</label>
            <div className="grid grid-cols-2 gap-2">
              {patterns.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTrafficPattern(p.id)}
                  className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-all ${
                    trafficPattern === p.id
                      ? 'border-accent-blue bg-accent-blue/10'
                      : 'border-border hover:border-gray-600 bg-surface-700'
                  }`}
                >
                  <p.icon size={16} style={{ color: p.color }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-white">{p.label}</span>
                    <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{p.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Clock size={12} /> Duration
              </label>
              <span className="text-xs font-mono text-accent-cyan">{duration} ticks ({Math.round(duration * tickRate / 1000)}s real-time)</span>
            </div>
            <input
              type="range" min={30} max={1000} step={10} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full h-1.5 bg-surface-600 rounded-lg appearance-none cursor-pointer accent-accent-blue"
            />
            <div className="flex justify-between text-[9px] text-gray-600 mt-1">
              <span>30 ticks</span><span>500</span><span>1000 ticks</span>
            </div>
          </div>

          {/* Tick Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Zap size={12} /> Simulation Speed
              </label>
              <span className="text-xs font-mono text-accent-cyan">{tickRate}ms/tick ({(1000/tickRate).toFixed(1)} tps)</span>
            </div>
            <input
              type="range" min={200} max={5000} step={100} value={tickRate}
              onChange={(e) => setTickRate(Number(e.target.value))}
              className="w-full h-1.5 bg-surface-600 rounded-lg appearance-none cursor-pointer accent-accent-blue"
            />
            <div className="flex justify-between text-[9px] text-gray-600 mt-1">
              <span>Fast (200ms)</span><span>Normal (1s)</span><span>Slow (5s)</span>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-surface-900 rounded-lg p-3 border border-border">
            <h4 className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-2">Simulation Summary</h4>
            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="text-gray-500">Virtual Users</span>
              <span className="text-white text-right">{trafficLevel.toLocaleString()}</span>
              <span className="text-gray-500">Pattern</span>
              <span className="text-white text-right capitalize">{trafficPattern}</span>
              <span className="text-gray-500">Duration</span>
              <span className="text-white text-right">{duration} ticks</span>
              <span className="text-gray-500">Real-time Duration</span>
              <span className="text-white text-right">{Math.round(duration * tickRate / 1000)}s</span>
              <span className="text-gray-500">Speed</span>
              <span className="text-white text-right">{(1000/tickRate).toFixed(1)} ticks/sec</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-xs text-gray-400 hover:text-white">Cancel</button>
          <button
            onClick={() => { onStart(); onClose(); }}
            className="px-4 py-2 text-xs bg-green-600 text-white rounded-lg hover:bg-green-500 flex items-center gap-1.5 font-medium"
          >
            <Activity size={12} /> Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

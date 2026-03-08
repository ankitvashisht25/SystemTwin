import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import * as Icons from 'lucide-react';
import type { FlowNodeData } from '../../../stores/architectureStore';
import { categoryColors } from '@systemtwin/shared';
import { useSimulationStore } from '../../../stores/simulationStore';

const iconMap: Record<string, React.ComponentType<any>> = {
  Globe: Icons.Globe, Smartphone: Icons.Smartphone, Cloud: Icons.Cloud,
  Server: Icons.Server, Shield: Icons.Shield, Cog: Icons.Cog,
  ArrowLeftRight: Icons.ArrowLeftRight, Database: Icons.Database,
  Zap: Icons.Zap, MailPlus: Icons.Mail, Split: Icons.Split,
  Network: Icons.Network, Repeat: Icons.Repeat, FileText: Icons.FileText,
  GitBranch: Icons.GitBranch, Radio: Icons.Radio, Clock: Icons.Clock,
  Bell: Icons.Bell, Search: Icons.Search, Layers: Icons.Layers,
  Megaphone: Icons.Megaphone, Globe2: Icons.Globe2, ShieldCheck: Icons.ShieldCheck,
  Waypoints: Icons.Waypoints, HardDrive: Icons.HardDrive, Box: Icons.Box,
  Monitor: Icons.Monitor, Sparkles: Icons.Sparkles, Cylinder: Icons.Cylinder,
  Container: Icons.Container, Workflow: Icons.Workflow, Inbox: Icons.Inbox,
  Orbit: Icons.Orbit, KeyRound: Icons.KeyRound, Route: Icons.Route,
};

const statusColors: Record<string, { border: string; bg: string; glow: string }> = {
  healthy: { border: '#10b981', bg: '#10b98115', glow: '0 0 12px #10b98130' },
  degraded: { border: '#f59e0b', bg: '#f59e0b15', glow: '0 0 16px #f59e0b40' },
  failed: { border: '#ef4444', bg: '#ef444415', glow: '0 0 20px #ef444450' },
  offline: { border: '#64748b', bg: '#64748b15', glow: 'none' },
};

function MeterBar({ value, max = 100, thresholds = [50, 80] }: { value: number; max?: number; thresholds?: number[] }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > thresholds[1] ? '#ef4444' : pct > thresholds[0] ? '#f59e0b' : '#10b981';
  return (
    <div className="h-1 flex-1 rounded-full bg-surface-600 overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

function BaseNode({ data, selected, id }: NodeProps & { data: FlowNodeData }) {
  const Icon = iconMap[data.icon] || Icons.Server;
  const catColor = categoryColors[data.category] || '#8b5cf6';
  const status = statusColors[data.status] || statusColors.healthy;
  const simStatus = useSimulationStore((s) => s.status);
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);

  // Get latest metrics for this node
  const nodeMetrics = metricsHistory.get(id);
  const latest = nodeMetrics && nodeMetrics.length > 0 ? nodeMetrics[nodeMetrics.length - 1] : null;
  const isSimulating = simStatus === 'running' || simStatus === 'completed';

  // Dynamic glow based on load
  let dynamicGlow = status.glow;
  if (latest && isSimulating) {
    if (latest.cpu > 80 || latest.errorRate > 10) {
      dynamicGlow = `0 0 24px ${status.border}60`;
    }
  }

  return (
    <div
      className={`
        relative rounded-xl min-w-[160px] transition-all duration-300
        border-2
        ${selected ? 'ring-2 ring-accent-blue ring-offset-1 ring-offset-surface-900' : ''}
      `}
      style={{ borderColor: status.border, backgroundColor: '#0f1520', boxShadow: dynamicGlow }}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gray-500 !border-2 !border-surface-900 hover:!bg-accent-blue transition-colors" />

      {/* Status indicator */}
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-surface-900" style={{ backgroundColor: status.border }}>
        {data.status === 'failed' && (
          <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: status.border, opacity: 0.4 }} />
        )}
      </div>

      {/* Main content */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${catColor}20`, color: catColor }}>
            <Icon size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-semibold text-gray-200 leading-tight truncate">{data.label}</span>
            <span className="text-[9px] text-gray-500 capitalize">{data.componentType.replace(/-/g, ' ')}</span>
          </div>
        </div>

        {/* Live metrics overlay — only during simulation */}
        {isSimulating && latest && (
          <div className="mt-2 pt-2 border-t border-surface-700 space-y-1.5">
            {/* CPU + Memory bars */}
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-gray-500 w-7">CPU</span>
              <MeterBar value={latest.cpu} />
              <span className="text-[8px] text-gray-400 w-8 text-right">{Math.round(latest.cpu)}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] text-gray-500 w-7">MEM</span>
              <MeterBar value={latest.memory} />
              <span className="text-[8px] text-gray-400 w-8 text-right">{Math.round(latest.memory)}%</span>
            </div>

            {/* Stats row */}
            <div className="flex items-center justify-between text-[8px] mt-1">
              <span className="text-gray-500">{Math.round(latest.latency)}ms</span>
              <span className="text-gray-500">{Math.round(latest.throughput)} rps</span>
              {latest.errorRate > 0.5 && (
                <span className="text-red-400 font-medium">{latest.errorRate.toFixed(1)}% err</span>
              )}
              {latest.errorRate <= 0.5 && (
                <span className="text-green-500">{Math.round(latest.connections)} conn</span>
              )}
            </div>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gray-500 !border-2 !border-surface-900 hover:!bg-accent-blue transition-colors" />
    </div>
  );
}

export default memo(BaseNode);

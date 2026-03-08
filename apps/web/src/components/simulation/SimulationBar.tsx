import { Activity, Zap, XCircle, Clock, Gauge, Wifi } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import ConnectionStatus from '../ui/ConnectionStatus';

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

export default function SimulationBar() {
  const status = useSimulationStore((s) => s.status);
  const tick = useSimulationStore((s) => s.tick);
  const globalStats = useSimulationStore((s) => s.globalStats);
  const failures = useSimulationStore((s) => s.failures);

  if (status === 'idle') return null;

  const stats = globalStats;
  const errorPct = stats && stats.totalRequests > 0
    ? ((stats.totalErrors / stats.totalRequests) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="h-7 border-b border-border bg-surface-900/80 backdrop-blur-sm flex items-center px-3 gap-4 flex-shrink-0 text-[10px] font-mono">
      {/* Status indicator */}
      <div className="flex items-center gap-1.5">
        {status === 'running' ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-green-400 font-semibold uppercase tracking-wider">Live</span>
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span className="text-gray-500 font-semibold uppercase tracking-wider">Completed</span>
          </>
        )}
        <span className="text-gray-600 ml-1">T+{tick}s</span>
      </div>

      <div className="w-px h-3.5 bg-border" />

      {/* Total requests */}
      <div className="flex items-center gap-1 text-gray-400">
        <Activity size={10} className="text-cyan-400" />
        <span className="text-cyan-300">{formatNum(stats?.totalRequests || 0)}</span>
        <span className="text-gray-600">req</span>
      </div>

      {/* Error rate */}
      <div className="flex items-center gap-1 text-gray-400">
        <XCircle size={10} className={Number(errorPct) > 5 ? 'text-red-400' : 'text-gray-500'} />
        <span className={Number(errorPct) > 5 ? 'text-red-400' : 'text-gray-400'}>{errorPct}%</span>
        <span className="text-gray-600">err</span>
      </div>

      {/* Avg latency */}
      <div className="flex items-center gap-1 text-gray-400">
        <Clock size={10} className="text-blue-400" />
        <span className="text-blue-300">{stats ? Math.round(stats.avgLatency) : 0}ms</span>
        <span className="text-gray-600">avg</span>
      </div>

      {/* P99 latency */}
      <div className="flex items-center gap-1 text-gray-400">
        <Gauge size={10} className={stats && stats.p99Latency > 500 ? 'text-yellow-400' : 'text-gray-500'} />
        <span className={stats && stats.p99Latency > 500 ? 'text-yellow-400' : 'text-gray-400'}>
          {stats ? Math.round(stats.p99Latency) : 0}ms
        </span>
        <span className="text-gray-600">p99</span>
      </div>

      {/* Connections */}
      <div className="flex items-center gap-1 text-gray-400">
        <Wifi size={10} className="text-purple-400" />
        <span className="text-purple-300">{formatNum(stats?.activeConnections || 0)}</span>
        <span className="text-gray-600">conn</span>
      </div>

      <div className="flex-1" />

      {/* Node health */}
      {stats && (
        <div className="flex items-center gap-2.5">
          {stats.healthyNodes > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-green-400">{stats.healthyNodes}</span>
            </div>
          )}
          {stats.degradedNodes > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <span className="text-yellow-400">{stats.degradedNodes}</span>
            </div>
          )}
          {stats.failedNodes > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-red-400">{stats.failedNodes}</span>
            </div>
          )}
        </div>
      )}

      {/* Active failures count */}
      {failures.length > 0 && (
        <>
          <div className="w-px h-3.5 bg-border" />
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-red-400" />
            <span className="text-red-400">{failures.length} fault{failures.length > 1 ? 's' : ''}</span>
          </div>
        </>
      )}

      <div className="w-px h-3.5 bg-border" />
      <ConnectionStatus />
    </div>
  );
}

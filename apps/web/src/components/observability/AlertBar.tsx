import { useMemo } from 'react';
import { AlertTriangle, XCircle, Info } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useArchitectureStore } from '../../stores/architectureStore';

export default function AlertBar() {
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);
  const nodes = useArchitectureStore((s) => s.nodes);

  const alerts = useMemo(() => {
    const result: Array<{ nodeId: string; label: string; severity: 'critical' | 'warning' | 'info'; message: string }> = [];

    for (const node of nodes) {
      const history = metricsHistory.get(node.id);
      if (!history || history.length === 0) continue;
      const latest = history[history.length - 1];

      if (latest.errorRate > 50) {
        result.push({ nodeId: node.id, label: node.data.label, severity: 'critical', message: `Error rate at ${latest.errorRate.toFixed(1)}%` });
      } else if (latest.errorRate > 10) {
        result.push({ nodeId: node.id, label: node.data.label, severity: 'warning', message: `Elevated error rate: ${latest.errorRate.toFixed(1)}%` });
      }

      if (latest.cpu > 90) {
        result.push({ nodeId: node.id, label: node.data.label, severity: 'critical', message: `CPU at ${latest.cpu.toFixed(0)}%` });
      } else if (latest.cpu > 70) {
        result.push({ nodeId: node.id, label: node.data.label, severity: 'warning', message: `High CPU: ${latest.cpu.toFixed(0)}%` });
      }

      if (latest.latency > 1000) {
        result.push({ nodeId: node.id, label: node.data.label, severity: 'critical', message: `Latency: ${latest.latency.toFixed(0)}ms` });
      } else if (latest.latency > 500) {
        result.push({ nodeId: node.id, label: node.data.label, severity: 'warning', message: `High latency: ${latest.latency.toFixed(0)}ms` });
      }

      if (latest.memory > 90) {
        result.push({ nodeId: node.id, label: node.data.label, severity: 'warning', message: `Memory at ${latest.memory.toFixed(0)}%` });
      }
    }

    return result.sort((a, b) => (a.severity === 'critical' ? -1 : 1) - (b.severity === 'critical' ? -1 : 1));
  }, [metricsHistory, nodes]);

  if (alerts.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <Info size={24} className="mb-2 opacity-30" />
        <p className="text-xs">No active alerts</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2 space-y-1.5">
      {alerts.map((alert, i) => (
        <div
          key={`${alert.nodeId}-${i}`}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs ${
            alert.severity === 'critical'
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-yellow-500/10 border border-yellow-500/20'
          }`}
        >
          {alert.severity === 'critical' ? (
            <XCircle size={14} className="text-red-400 flex-shrink-0" />
          ) : (
            <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0" />
          )}
          <span className={`font-medium ${alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>
            {alert.label}
          </span>
          <span className="text-gray-400">{alert.message}</span>
        </div>
      ))}
    </div>
  );
}

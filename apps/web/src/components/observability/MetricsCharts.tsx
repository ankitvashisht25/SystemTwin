import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useSimulationStore } from '../../stores/simulationStore';
import { useArchitectureStore } from '../../stores/architectureStore';

const metricDefs = [
  { key: 'cpu', label: 'CPU %', color: '#3b82f6', unit: '%', warn: 70, crit: 90 },
  { key: 'memory', label: 'Memory %', color: '#8b5cf6', unit: '%', warn: 70, crit: 90 },
  { key: 'latency', label: 'Latency', color: '#f59e0b', unit: 'ms', warn: 200, crit: 1000 },
  { key: 'errorRate', label: 'Error Rate', color: '#ef4444', unit: '%', warn: 5, crit: 20 },
  { key: 'throughput', label: 'Throughput', color: '#10b981', unit: 'rps', warn: 0, crit: 0 },
  { key: 'connections', label: 'Connections', color: '#06b6d4', unit: '', warn: 0, crit: 0 },
  { key: 'queueDepth', label: 'Queue Depth', color: '#ec4899', unit: '', warn: 50, crit: 200 },
];

export default function MetricsCharts() {
  const metricsHistory = useSimulationStore((s) => s.metricsHistory);
  const nodes = useArchitectureStore((s) => s.nodes);
  const selectedNodeId = useArchitectureStore((s) => s.selectedNodeId);

  const targetNodes = useMemo(() => {
    if (selectedNodeId) return nodes.filter((n) => n.id === selectedNodeId);
    return nodes.slice(0, 6); // Show max 6 nodes
  }, [nodes, selectedNodeId]);

  const [chartType, setChartType] = useState<'line' | 'area'>('area');

  const chartData = useMemo(() => {
    if (targetNodes.length === 0) return [];
    const firstNode = targetNodes[0];
    const history = metricsHistory.get(firstNode.id) || [];
    return history.map((m, i) => {
      const point: Record<string, unknown> = { tick: i };
      for (const node of targetNodes) {
        const nh = metricsHistory.get(node.id) || [];
        const metric = nh[i];
        if (metric) {
          point[`${node.id}_cpu`] = Number(metric.cpu.toFixed(1));
          point[`${node.id}_memory`] = Number(metric.memory.toFixed(1));
          point[`${node.id}_latency`] = Number(metric.latency.toFixed(0));
          point[`${node.id}_errorRate`] = Number(metric.errorRate.toFixed(1));
          point[`${node.id}_throughput`] = Number(metric.throughput.toFixed(0));
          point[`${node.id}_connections`] = Math.round(metric.connections);
          point[`${node.id}_queueDepth`] = Math.round(metric.queueDepth);
        }
      }
      return point;
    });
  }, [metricsHistory, targetNodes]);

  // Current values for badges
  const currentValues = useMemo(() => {
    const values: Record<string, Record<string, number>> = {};
    for (const node of targetNodes) {
      const nh = metricsHistory.get(node.id) || [];
      const latest = nh[nh.length - 1];
      if (latest) {
        values[node.id] = {
          cpu: latest.cpu, memory: latest.memory, latency: latest.latency,
          errorRate: latest.errorRate, throughput: latest.throughput,
          connections: latest.connections, queueDepth: latest.queueDepth,
        };
      }
    }
    return values;
  }, [metricsHistory, targetNodes]);

  if (targetNodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 text-xs">
        No nodes to display metrics for
      </div>
    );
  }

  const nodeColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="h-full flex flex-col">
      {/* Chart type toggle + legend */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-surface-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          {targetNodes.map((node, i) => (
            <div key={node.id} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: nodeColors[i % nodeColors.length] }} />
              <span className="text-[9px] text-gray-400">{node.data.label}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType('area')}
            className={`px-2 py-0.5 text-[9px] rounded ${chartType === 'area' ? 'bg-accent-blue/20 text-accent-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >Area</button>
          <button
            onClick={() => setChartType('line')}
            className={`px-2 py-0.5 text-[9px] rounded ${chartType === 'line' ? 'bg-accent-blue/20 text-accent-blue' : 'text-gray-500 hover:text-gray-300'}`}
          >Line</button>
        </div>
      </div>

      {/* Charts grid */}
      <div className="flex-1 flex gap-0.5 p-1.5 overflow-x-auto">
        {metricDefs.map((metric) => {
          // Get current value badge for first target node
          const firstVal = targetNodes[0] ? currentValues[targetNodes[0].id]?.[metric.key] : null;
          const badgeColor = metric.crit > 0 && firstVal !== null
            ? (firstVal > metric.crit ? '#ef4444' : firstVal > metric.warn ? '#f59e0b' : '#10b981')
            : metric.color;

          return (
            <div key={metric.key} className="flex-1 min-w-[150px]">
              <div className="flex items-center justify-between px-1 mb-0.5">
                <p className="text-[9px] text-gray-500 font-medium">{metric.label}</p>
                {firstVal !== null && (
                  <span className="text-[9px] font-mono font-medium" style={{ color: badgeColor }}>
                    {metric.key === 'latency' ? `${Math.round(firstVal)}${metric.unit}` :
                     metric.key === 'throughput' ? `${Math.round(firstVal)}` :
                     `${firstVal.toFixed(metric.key === 'errorRate' ? 1 : 0)}${metric.unit}`}
                  </span>
                )}
              </div>
              <ResponsiveContainer width="100%" height="88%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -20 }}>
                    <defs>
                      {targetNodes.map((node, i) => (
                        <linearGradient key={node.id} id={`grad-${node.id}-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={nodeColors[i % nodeColors.length]} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={nodeColors[i % nodeColors.length]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="tick" tick={false} axisLine={{ stroke: '#1e293b' }} />
                    <YAxis tick={{ fontSize: 8, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1520', border: '1px solid #1e293b', borderRadius: 8, fontSize: 10, padding: '4px 8px' }} />
                    {targetNodes.map((node, i) => (
                      <Area
                        key={node.id}
                        type="monotone"
                        dataKey={`${node.id}_${metric.key}`}
                        name={node.data.label}
                        stroke={nodeColors[i % nodeColors.length]}
                        fill={`url(#grad-${node.id}-${metric.key})`}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </AreaChart>
                ) : (
                  <LineChart data={chartData} margin={{ top: 2, right: 4, bottom: 2, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="tick" tick={false} axisLine={{ stroke: '#1e293b' }} />
                    <YAxis tick={{ fontSize: 8, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f1520', border: '1px solid #1e293b', borderRadius: 8, fontSize: 10, padding: '4px 8px' }} />
                    {targetNodes.map((node, i) => (
                      <Line
                        key={node.id}
                        type="monotone"
                        dataKey={`${node.id}_${metric.key}`}
                        name={node.data.label}
                        stroke={nodeColors[i % nodeColors.length]}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}

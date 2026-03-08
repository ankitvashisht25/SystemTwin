import { useEffect, useRef, useMemo, useState } from 'react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useArchitectureStore } from '../../stores/architectureStore';

const levelColors = {
  INFO: 'text-blue-400',
  WARN: 'text-yellow-400',
  ERROR: 'text-red-400',
};

const levelBg = {
  INFO: 'bg-blue-400/5',
  WARN: 'bg-yellow-400/5',
  ERROR: 'bg-red-400/5',
};

export default function LogViewer() {
  const logs = useSimulationStore((s) => s.logs);
  const nodes = useArchitectureStore((s) => s.nodes);
  const [filter, setFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filter !== 'all' && log.nodeId !== filter) return false;
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      return true;
    });
  }, [logs, filter, levelFilter]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filteredLogs.length]);

  return (
    <div className="h-full flex flex-col">
      {/* Filters */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border flex-shrink-0">
        <select
          className="bg-surface-700 border border-border rounded px-2 py-1 text-xs focus:outline-none"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Services</option>
          {nodes.map((n) => (
            <option key={n.id} value={n.id}>{n.data.label}</option>
          ))}
        </select>
        <select
          className="bg-surface-700 border border-border rounded px-2 py-1 text-xs focus:outline-none"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
        >
          <option value="all">All Levels</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="ERROR">ERROR</option>
        </select>
        <span className="text-xs text-gray-600 ml-auto">{filteredLogs.length} entries</span>
      </div>

      {/* Log entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto font-mono">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-600 text-xs">
            No logs yet — start a simulation
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className={`flex items-start gap-3 px-3 py-1 text-xs hover:bg-surface-700/50 ${levelBg[log.level]}`}>
              <span className="text-gray-600 flex-shrink-0 w-20">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className={`flex-shrink-0 w-12 font-semibold ${levelColors[log.level]}`}>
                {log.level}
              </span>
              <span className="text-accent-cyan flex-shrink-0 w-24 truncate">
                {nodes.find((n) => n.id === log.nodeId)?.data.label || log.nodeId}
              </span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

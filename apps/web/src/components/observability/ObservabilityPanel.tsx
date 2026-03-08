import { BarChart3, ScrollText, Bell } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import MetricsCharts from './MetricsCharts';
import LogViewer from './LogViewer';
import AlertBar from './AlertBar';

export default function ObservabilityPanel() {
  const activeTab = useUIStore((s) => s.activeBottomTab);
  const setActiveTab = useUIStore((s) => s.setActiveBottomTab);

  const tabs = [
    { id: 'metrics' as const, label: 'Metrics', icon: BarChart3 },
    { id: 'logs' as const, label: 'Logs', icon: ScrollText },
    { id: 'alerts' as const, label: 'Alerts', icon: Bell },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border px-3 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon size={13} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'metrics' && <MetricsCharts />}
        {activeTab === 'logs' && <LogViewer />}
        {activeTab === 'alerts' && <AlertBar />}
      </div>
    </div>
  );
}

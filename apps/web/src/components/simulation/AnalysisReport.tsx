import { useState, useEffect } from 'react';
import { X, Brain, AlertTriangle, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { useArchitectureStore } from '../../stores/architectureStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useUIStore } from '../../stores/uiStore';
import { apiFetch } from '../../lib/api';
import type { AnalysisReport as AnalysisReportType } from '@systemtwin/shared';

export default function AnalysisReport() {
  const setShowAnalysisModal = useUIStore((s) => s.setShowAnalysisModal);
  const getArchitectureData = useArchitectureStore((s) => s.getArchitectureData);
  const { metricsHistory, logs, failures, analysisReport, setAnalysisReport } = useSimulationStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (analysisReport) return;

    const analyze = async () => {
      setLoading(true);
      const data = getArchitectureData();
      const architecture = {
        id: 'analysis',
        name: 'Analysis',
        nodes: data.nodes,
        edges: data.edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Flatten metrics for API
      const flatMetrics = Array.from(metricsHistory.entries()).flatMap(([, history]) => history);

      try {
        const res = await apiFetch('/api/analysis', {
          method: 'POST',
          body: JSON.stringify({
            architecture,
            metrics: [flatMetrics],
            logs,
            failures,
          }),
        });
        const report: AnalysisReportType = await res.json();
        setAnalysisReport(report);
      } catch {
        setAnalysisReport({
          summary: 'Error generating analysis report.',
          rootCause: 'Unable to connect to analysis service.',
          cascadingEffects: [],
          recommendations: ['Ensure the backend server is running.'],
          timeline: [],
        });
      }
      setLoading(false);
    };
    analyze();
  }, [analysisReport, getArchitectureData, metricsHistory, logs, failures, setAnalysisReport]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowAnalysisModal(false)}>
      <div className="bg-surface-800 border border-border rounded-xl w-[640px] max-h-[80vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-accent-purple" />
            <span className="text-sm font-semibold">AI System Analysis</span>
          </div>
          <button onClick={() => setShowAnalysisModal(false)} className="p-1 hover:bg-surface-600 rounded">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 size={24} className="text-accent-purple animate-spin" />
              <p className="text-xs text-gray-500">Analyzing simulation data...</p>
            </div>
          ) : analysisReport ? (
            <>
              {/* Summary */}
              <div className="bg-surface-700/50 rounded-lg p-3 border border-border">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Summary</h3>
                <p className="text-sm text-gray-200 leading-relaxed">{analysisReport.summary}</p>
              </div>

              {/* Root Cause */}
              <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={13} className="text-red-400" />
                  <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Root Cause</h3>
                </div>
                <p className="text-sm text-gray-200 leading-relaxed">{analysisReport.rootCause}</p>
              </div>

              {/* Cascading Effects */}
              {analysisReport.cascadingEffects.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ArrowRight size={12} />
                    Cascading Effects
                  </h3>
                  <div className="space-y-1.5">
                    {analysisReport.cascadingEffects.map((effect, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 bg-yellow-500/5 rounded-lg border border-yellow-500/10">
                        <span className="text-yellow-400 text-xs mt-0.5">*</span>
                        <p className="text-xs text-gray-300">{effect}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisReport.recommendations.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle size={12} className="text-green-400" />
                    Recommendations
                  </h3>
                  <div className="space-y-1.5">
                    {analysisReport.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-2 bg-green-500/5 rounded-lg border border-green-500/10">
                        <span className="text-green-400 text-xs font-mono mt-0.5">{i + 1}.</span>
                        <p className="text-xs text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {analysisReport.timeline.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Event Timeline</h3>
                  <div className="space-y-1">
                    {analysisReport.timeline.map((event, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 font-mono w-12">T+{event.time}s</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                        <span className="text-gray-300">{event.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

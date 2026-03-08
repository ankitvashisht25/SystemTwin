import { memo } from 'react';
import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';
import { useSimulationStore } from '../../../stores/simulationStore';

function AnimatedEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, source, target, style, markerEnd } = props;
  const simStatus = useSimulationStore((s) => s.status);
  const edgeTraffic = useSimulationStore((s) => s.edgeTraffic);

  const [edgePath] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 12 });

  const isSimulating = simStatus === 'running' || simStatus === 'completed';
  const traffic = edgeTraffic.find(e => e.source === source && e.target === target);

  // Determine edge styling based on traffic
  let strokeColor = '#334155';
  let strokeWidth = 2;
  let particleSpeed = '3s';
  let particleCount = 1;
  let particleColor = '#3b82f6';

  if (isSimulating && traffic) {
    // Color by error rate
    if (traffic.errorRate > 20) { strokeColor = '#ef4444'; particleColor = '#ef4444'; }
    else if (traffic.errorRate > 5) { strokeColor = '#f59e0b'; particleColor = '#f59e0b'; }
    else if (traffic.requestsPerSec > 0) { strokeColor = '#10b981'; particleColor = '#10b981'; }

    // Width by traffic volume
    if (traffic.requestsPerSec > 500) strokeWidth = 4;
    else if (traffic.requestsPerSec > 100) strokeWidth = 3;
    else if (traffic.requestsPerSec > 0) strokeWidth = 2;
    else { strokeWidth = 1; strokeColor = '#1e293b'; }

    // Speed by latency (higher latency = slower particles)
    if (traffic.avgLatency > 500) particleSpeed = '6s';
    else if (traffic.avgLatency > 200) particleSpeed = '4s';
    else if (traffic.avgLatency > 50) particleSpeed = '2s';
    else particleSpeed = '1.2s';

    // More particles for higher traffic
    if (traffic.requestsPerSec > 300) particleCount = 3;
    else if (traffic.requestsPerSec > 100) particleCount = 2;
  }

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={{ stroke: strokeColor, strokeWidth, transition: 'stroke 0.5s, stroke-width 0.3s', ...style }} />
      {/* Animated particles */}
      {Array.from({ length: particleCount }).map((_, i) => (
        <circle key={i} r={strokeWidth} fill={particleColor} opacity={0.8}>
          <animateMotion dur={particleSpeed} repeatCount="indefinite" path={edgePath} begin={`${(i * parseFloat(particleSpeed)) / particleCount}s`} />
        </circle>
      ))}
    </>
  );
}

export default memo(AnimatedEdge);

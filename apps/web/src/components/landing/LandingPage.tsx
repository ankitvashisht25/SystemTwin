import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Zap, Shield, BarChart3, GitBranch, Layers, Terminal,
  Database, Server, Globe, Network, Cpu, Activity, ChevronRight,
  Play, Flame, Brain, CloudLightning, MousePointerClick,
  Gauge, AlertTriangle, FileCode, ArrowDown
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   ATMOSPHERIC BACKGROUND — layered grid + particles + orbs
   ═══════════════════════════════════════════════════════════ */
function AtmosphericBackground() {
  const orbs = useMemo(() =>
    Array.from({ length: 3 }).map((_, i) => ({
      id: i,
      x: 20 + i * 30,
      y: 10 + i * 25,
      size: 300 + i * 150,
      color: ['rgba(6,182,212,0.07)', 'rgba(139,92,246,0.05)', 'rgba(59,130,246,0.06)'][i],
      duration: 20 + i * 5,
    })), []);

  const particles = useMemo(() =>
    Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 5 + Math.random() * 10,
      size: Math.random() > 0.7 ? 3 : 1.5,
      opacity: 0.2 + Math.random() * 0.4,
    })), []);

  return (
    <div className="landing-atmos">
      {/* Grid */}
      <div className="landing-grid-lines" />
      {/* Gradient orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="landing-orb"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            animationDuration: `${orb.duration}s`,
          }}
        />
      ))}
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="landing-particle"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            opacity: p.opacity,
          }}
        />
      ))}
      {/* Noise overlay */}
      <div className="landing-noise" />
      {/* Top-down light cone */}
      <div className="landing-light-cone" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HERO DIAGRAM — Realistic nodes with live metrics + cascade
   ═══════════════════════════════════════════════════════════ */
interface DiagramNode {
  id: string;
  label: string;
  type: string;
  icon: React.ComponentType<any>;
  x: number;
  y: number;
  color: string;
  delay: number;
  metrics: { cpu: number; mem: number; rps: number; lat: string };
}

const heroNodes: DiagramNode[] = [
  { id: 'fe', label: 'Web App', type: 'frontend', icon: Globe, x: 30, y: 55, color: '#3b82f6', delay: 0.3, metrics: { cpu: 24, mem: 38, rps: 1240, lat: '12ms' } },
  { id: 'lb', label: 'Load Balancer', type: 'infra', icon: Network, x: 220, y: 55, color: '#6366f1', delay: 0.55, metrics: { cpu: 12, mem: 22, rps: 4820, lat: '2ms' } },
  { id: 'api', label: 'API Service', type: 'backend', icon: Server, x: 410, y: 10, color: '#8b5cf6', delay: 0.8, metrics: { cpu: 47, mem: 62, rps: 2100, lat: '45ms' } },
  { id: 'auth', label: 'Auth Service', type: 'backend', icon: Shield, x: 410, y: 120, color: '#8b5cf6', delay: 0.9, metrics: { cpu: 31, mem: 41, rps: 890, lat: '28ms' } },
  { id: 'redis', label: 'Redis Cache', type: 'cache', icon: Zap, x: 620, y: 10, color: '#10b981', delay: 1.15, metrics: { cpu: 8, mem: 71, rps: 8400, lat: '1ms' } },
  { id: 'db', label: 'PostgreSQL', type: 'database', icon: Database, x: 620, y: 120, color: '#f59e0b', delay: 1.25, metrics: { cpu: 52, mem: 68, rps: 1600, lat: '8ms' } },
];

const heroEdges = [
  { from: 'fe', to: 'lb', delay: 0.7 },
  { from: 'lb', to: 'api', delay: 1.0 },
  { from: 'lb', to: 'auth', delay: 1.05 },
  { from: 'api', to: 'redis', delay: 1.3 },
  { from: 'api', to: 'db', delay: 1.35 },
  { from: 'auth', to: 'db', delay: 1.4 },
];

/* Metrics that change based on status */
const failedMetrics = { cpu: 0, mem: 0, rps: 0, lat: '--' };
const degradedMetrics = { cpu: 89, mem: 87, rps: 340, lat: '920ms' };

function MiniSparkline({ color, failed }: { color: string; failed: boolean }) {
  const points = useMemo(() => {
    if (failed) return '0,12 8,12 16,12 24,12 32,12';
    return Array.from({ length: 8 }).map((_, i) => `${i * 4.5},${4 + Math.random() * 8}`).join(' ');
  }, [failed]);
  return (
    <svg width="36" height="14" viewBox="0 0 36 14" className="opacity-60">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeroDiagram() {
  const [phase, setPhase] = useState<'healthy' | 'failing' | 'cascade' | 'recovering'>('healthy');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timeline = [
      { at: 4000, phase: 'failing' as const },
      { at: 5500, phase: 'cascade' as const },
      { at: 8500, phase: 'recovering' as const },
      { at: 10000, phase: 'healthy' as const },
    ];

    const timers = timeline.map(({ at, phase: p }) =>
      setTimeout(() => setPhase(p), at)
    );

    const loop = setInterval(() => {
      setPhase('healthy');
      timeline.forEach(({ at, phase: p }) => {
        timers.push(setTimeout(() => setPhase(p), at));
      });
    }, 12000);

    // Tick counter for subtle metric changes
    const tickTimer = setInterval(() => setTick((t) => t + 1), 1000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(loop);
      clearInterval(tickTimer);
    };
  }, []);

  const getStatus = (id: string) => {
    if (phase === 'failing' && id === 'db') return 'failed';
    if (phase === 'cascade') {
      if (id === 'db') return 'failed';
      if (['api', 'auth'].includes(id)) return 'degraded';
    }
    if (phase === 'recovering' && id === 'db') return 'degraded';
    return 'healthy';
  };

  const getColor = (id: string) => {
    const s = getStatus(id);
    if (s === 'failed') return '#ef4444';
    if (s === 'degraded') return '#f59e0b';
    return heroNodes.find((n) => n.id === id)?.color || '#10b981';
  };

  const getMetrics = (node: DiagramNode) => {
    const s = getStatus(node.id);
    if (s === 'failed') return failedMetrics;
    if (s === 'degraded') return degradedMetrics;
    // Add slight jitter
    return {
      cpu: node.metrics.cpu + Math.floor(Math.sin(tick + node.x) * 3),
      mem: node.metrics.mem + Math.floor(Math.cos(tick + node.y) * 2),
      rps: node.metrics.rps + Math.floor(Math.sin(tick * 0.5) * 50),
      lat: node.metrics.lat,
    };
  };

  return (
    <div className="relative w-full max-w-[800px] h-[220px] mx-auto select-none">
      {/* SVG edges */}
      <svg width="100%" height="100%" viewBox="0 0 800 200" fill="none" className="absolute inset-0 overflow-visible">
        {heroEdges.map((edge) => {
          const from = heroNodes.find((n) => n.id === edge.from)!;
          const to = heroNodes.find((n) => n.id === edge.to)!;
          const x1 = from.x + 155, y1 = from.y + 35;
          const x2 = to.x, y2 = to.y + 35;
          const mx = (x1 + x2) / 2;
          const color = getColor(edge.to);
          const pathD = `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;

          return (
            <g key={`${edge.from}-${edge.to}`}>
              <motion.path
                d={pathD}
                stroke={color}
                strokeWidth="1.5"
                strokeOpacity={0.2}
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: edge.delay, ease: 'easeOut' }}
              />
              {/* Glow path */}
              <motion.path
                d={pathD}
                stroke={color}
                strokeWidth="4"
                strokeOpacity={0.06}
                fill="none"
                filter="url(#glow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: edge.delay, ease: 'easeOut' }}
              />
              {/* Data particles */}
              {getStatus(edge.to) !== 'failed' && [0, 1].map((pi) => (
                <circle key={pi} r="2.5" fill={color} opacity="0.7">
                  <animateMotion
                    dur={`${1.8 + pi * 0.8}s`}
                    repeatCount="indefinite"
                    begin={`${edge.delay + pi * 0.9}s`}
                    path={pathD}
                  />
                </circle>
              ))}
            </g>
          );
        })}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Nodes with realistic metrics */}
      {heroNodes.map((node) => {
        const Icon = node.icon;
        const color = getColor(node.id);
        const status = getStatus(node.id);
        const metrics = getMetrics(node);

        return (
          <motion.div
            key={node.id}
            className="absolute"
            style={{ left: node.x, top: node.y }}
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, delay: node.delay, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="hero-node"
              animate={{
                borderColor: `${color}50`,
                boxShadow: status === 'failed'
                  ? `0 0 20px ${color}30, 0 0 40px ${color}10, inset 0 0 20px ${color}05`
                  : `0 0 12px ${color}15, inset 0 0 15px ${color}03`,
              }}
              transition={{ duration: 0.6 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
                    <Icon size={11} />
                  </div>
                  <span className="text-[10px] font-semibold text-gray-200">{node.label}</span>
                </div>
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                  animate={status === 'failed' ? { scale: [1, 1.4, 1] } : {}}
                  transition={{ duration: 0.5, repeat: status === 'failed' ? Infinity : 0 }}
                />
              </div>
              {/* Metrics grid */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-500 uppercase">CPU</span>
                  <span className={`text-[9px] font-mono font-semibold ${status === 'failed' ? 'text-red-400' : metrics.cpu > 80 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {metrics.cpu}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-500 uppercase">MEM</span>
                  <span className={`text-[9px] font-mono font-semibold ${status === 'failed' ? 'text-red-400' : metrics.mem > 80 ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {metrics.mem}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-500 uppercase">RPS</span>
                  <span className="text-[9px] font-mono text-gray-300">{metrics.rps.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-gray-500 uppercase">LAT</span>
                  <span className={`text-[9px] font-mono ${status === 'degraded' ? 'text-yellow-400' : 'text-gray-300'}`}>{metrics.lat}</span>
                </div>
              </div>
              {/* Mini sparkline */}
              <div className="mt-1.5 flex justify-center">
                <MiniSparkline color={color} failed={status === 'failed'} />
              </div>
            </motion.div>
          </motion.div>
        );
      })}

      {/* Failure alert overlay */}
      {(phase === 'failing' || phase === 'cascade') && (
        <motion.div
          className="absolute -top-4 right-0 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <AlertTriangle size={10} className="text-red-400" />
          <span className="text-[9px] font-mono text-red-400 font-medium">
            {phase === 'failing' ? 'DB FAILURE DETECTED' : 'CASCADE PROPAGATING'}
          </span>
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ANIMATED TERMINAL — Shows real config generation
   ═══════════════════════════════════════════════════════════ */
const terminalLines = [
  { text: '$ systemtwin generate docker-compose', type: 'cmd' as const, delay: 0 },
  { text: '', type: 'blank' as const, delay: 600 },
  { text: 'Analyzing architecture graph...', type: 'info' as const, delay: 800 },
  { text: 'Found 6 services, 6 connections', type: 'info' as const, delay: 1200 },
  { text: '', type: 'blank' as const, delay: 1400 },
  { text: 'version: "3.8"', type: 'yaml' as const, delay: 1600 },
  { text: 'services:', type: 'yaml' as const, delay: 1800 },
  { text: '  api-service:', type: 'yaml' as const, delay: 2000 },
  { text: '    image: node:20-alpine', type: 'yaml' as const, delay: 2100 },
  { text: '    deploy:', type: 'yaml' as const, delay: 2200 },
  { text: '      replicas: 3', type: 'yaml' as const, delay: 2300 },
  { text: '    depends_on:', type: 'yaml' as const, delay: 2400 },
  { text: '      - redis', type: 'yaml' as const, delay: 2500 },
  { text: '      - postgres', type: 'yaml' as const, delay: 2600 },
  { text: '  redis:', type: 'yaml' as const, delay: 2800 },
  { text: '    image: redis:7-alpine', type: 'yaml' as const, delay: 2900 },
  { text: '  postgres:', type: 'yaml' as const, delay: 3100 },
  { text: '    image: postgres:16-alpine', type: 'yaml' as const, delay: 3200 },
  { text: '', type: 'blank' as const, delay: 3400 },
  { text: '✓ docker-compose.yml generated (3 services)', type: 'success' as const, delay: 3600 },
];

function AnimatedTerminal() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    terminalLines.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [isInView]);

  const lineColor = (type: string) => {
    switch (type) {
      case 'cmd': return 'text-cyan-400';
      case 'info': return 'text-gray-500';
      case 'yaml': return 'text-purple-300';
      case 'success': return 'text-green-400';
      default: return '';
    }
  };

  return (
    <div ref={ref} className="landing-terminal">
      <div className="landing-terminal-header">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[10px] text-gray-600 font-mono">systemtwin — terminal</span>
        <div className="w-14" />
      </div>
      <div className="landing-terminal-body">
        {terminalLines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`text-[11px] font-mono leading-relaxed ${lineColor(line.type)}`}>
            {line.text || '\u00A0'}
          </div>
        ))}
        {visibleLines < terminalLines.length && (
          <span className="inline-block w-2 h-3.5 bg-cyan-400/70 animate-pulse" />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   LIVE METRICS PREVIEW — Animated mini charts
   ═══════════════════════════════════════════════════════════ */
function MetricsPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [dataPoints, setDataPoints] = useState<number[][]>([[], [], [], []]);

  useEffect(() => {
    if (!isInView) return;
    const interval = setInterval(() => {
      setDataPoints((prev) =>
        prev.map((series, si) => {
          const base = [35, 45, 25, 120][si];
          const variance = [15, 20, 10, 80][si];
          const next = base + Math.random() * variance;
          return [...series.slice(-30), next];
        })
      );
    }, 200);
    return () => clearInterval(interval);
  }, [isInView]);

  const charts = [
    { label: 'CPU Usage', color: '#3b82f6', suffix: '%', max: 100 },
    { label: 'Memory', color: '#8b5cf6', suffix: '%', max: 100 },
    { label: 'Error Rate', color: '#ef4444', suffix: '%', max: 50 },
    { label: 'Latency', color: '#f59e0b', suffix: 'ms', max: 300 },
  ];

  return (
    <div ref={ref} className="landing-metrics-grid">
      {charts.map((chart, ci) => {
        const data = dataPoints[ci];
        const current = data[data.length - 1] || 0;
        const pathPoints = data.map((v, i) => {
          const x = (i / 30) * 200;
          const y = 50 - (v / chart.max) * 45;
          return `${x},${y}`;
        }).join(' ');

        return (
          <div key={chart.label} className="landing-metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-gray-500 font-mono uppercase">{chart.label}</span>
              <span className="text-xs font-mono font-semibold" style={{ color: chart.color }}>
                {current.toFixed(1)}{chart.suffix}
              </span>
            </div>
            <svg viewBox="0 0 200 50" className="w-full h-10 overflow-visible">
              {/* Area fill */}
              {data.length > 1 && (
                <path
                  d={`M 0,50 L ${pathPoints} L 200,50 Z`}
                  fill={`${chart.color}10`}
                />
              )}
              {/* Line */}
              {data.length > 1 && (
                <polyline
                  points={pathPoints}
                  fill="none"
                  stroke={chart.color}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Current value dot */}
              {data.length > 0 && (
                <circle
                  cx={Math.min((data.length / 30) * 200, 200)}
                  cy={50 - (current / chart.max) * 45}
                  r="3"
                  fill={chart.color}
                >
                  <animate attributeName="r" values="3;4.5;3" dur="1s" repeatCount="indefinite" />
                </circle>
              )}
            </svg>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   REUSABLE SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════ */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, description, color, delay }: {
  icon: React.ComponentType<any>; title: string; description: string; color: string; delay: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="landing-feature-card group">
        <div className="landing-feature-icon" style={{ backgroundColor: `${color}10`, color, borderColor: `${color}20` }}>
          <Icon size={20} />
        </div>
        <h3 className="text-sm font-semibold text-white mt-4 mb-1.5">{title}</h3>
        <p className="text-[12.5px] text-gray-500 leading-relaxed">{description}</p>
        <div className="landing-card-border-glow" style={{ '--glow-color': color } as React.CSSProperties} />
      </div>
    </Reveal>
  );
}

function StatCounter({ value, label, suffix = '', color }: { value: number; label: string; suffix?: string; color: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let current = 0;
    const timer = setInterval(() => {
      current += value / 35;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 40);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-3xl font-bold text-white" style={{ fontFamily: 'Outfit' }}>
        <span style={{ color }}>{count}</span>{suffix}
      </div>
      <div className="text-[10px] text-gray-600 mt-1.5 font-mono uppercase tracking-widest">{label}</div>
    </div>
  );
}

/* Component ticker */
const tickerItems = [
  { icon: Globe, label: 'Web App', c: '#3b82f6' }, { icon: Network, label: 'Load Balancer', c: '#6366f1' },
  { icon: Server, label: 'API Service', c: '#8b5cf6' }, { icon: Shield, label: 'Auth', c: '#8b5cf6' },
  { icon: Database, label: 'PostgreSQL', c: '#f59e0b' }, { icon: Database, label: 'MongoDB', c: '#f59e0b' },
  { icon: Zap, label: 'Redis', c: '#10b981' }, { icon: Layers, label: 'Kafka', c: '#ec4899' },
  { icon: Cpu, label: 'Worker', c: '#8b5cf6' }, { icon: CloudLightning, label: 'CDN', c: '#3b82f6' },
  { icon: Layers, label: 'RabbitMQ', c: '#ec4899' }, { icon: Database, label: 'MySQL', c: '#f59e0b' },
];

function Ticker() {
  return (
    <div className="landing-ticker-wrap">
      <div className="landing-ticker-fade-l" />
      <div className="landing-ticker-fade-r" />
      <div className="landing-ticker">
        {[...tickerItems, ...tickerItems].map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="landing-ticker-chip">
              <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${item.c}12`, color: item.c }}>
                <Icon size={12} />
              </div>
              <span className="text-[11px] text-gray-500 font-mono whitespace-nowrap">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);

  return (
    <div className="landing-root">
      <AtmosphericBackground />

      {/* ─── NAV ─── */}
      <motion.nav
        className="landing-nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Activity size={15} className="text-white" />
          </div>
          <span className="text-[15px] font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit' }}>
            System<span className="text-cyan-400">Twin</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How it Works', 'Preview'].map((t) => (
            <a key={t} href={`#${t.toLowerCase().replace(/ /g, '-')}`} className="text-[11px] text-gray-500 hover:text-gray-200 transition-colors font-medium tracking-widest uppercase">{t}</a>
          ))}
        </div>
        <button onClick={onEnterApp} className="landing-btn-primary-sm">
          Launch App <ArrowRight size={12} />
        </button>
      </motion.nav>

      {/* ─── HERO ─── */}
      <motion.section className="landing-hero" style={{ y: heroY, opacity: heroOpacity }}>
        <motion.div
          className="landing-hero-badge"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>Infrastructure Simulation Lab</span>
        </motion.div>

        <motion.h1
          className="landing-hero-title"
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          Design. Simulate.
          <br />
          <span className="landing-gradient-text">Break Things.</span>
        </motion.h1>

        <motion.p
          className="landing-hero-sub"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          Build distributed system architectures, inject real failures, and watch cascading impacts
          propagate through your infrastructure — all in a safe, simulated environment.
        </motion.p>

        <motion.div
          className="flex items-center gap-3 justify-center mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <button onClick={onEnterApp} className="landing-btn-primary">
            <Play size={14} /> Start Building <ArrowRight size={14} />
          </button>
          <a href="#features" className="landing-btn-ghost">
            Explore Features <ChevronRight size={13} />
          </a>
        </motion.div>

        {/* Hero architecture diagram */}
        <motion.div
          className="mt-16 relative w-full max-w-[860px] mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="landing-diagram-frame">
            {/* Frame header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500/70" />
                <span className="text-[10px] font-mono text-gray-600">architecture.twin</span>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-mono text-gray-600">
                <span>6 services</span>
                <span>6 connections</span>
                <span className="text-cyan-500/60">LIVE</span>
              </div>
            </div>
            {/* Diagram */}
            <div className="p-5 relative overflow-hidden">
              <div className="landing-diagram-grid" />
              <HeroDiagram />
            </div>
          </div>
          {/* Bottom label */}
          <div className="flex justify-center mt-3">
            <div className="flex items-center gap-4 text-[9px] font-mono text-gray-600">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Degraded</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Failed</span>
              <span className="text-gray-700">|</span>
              <span className="text-red-400/50">Watch the cascade propagate</span>
            </div>
          </div>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="mt-12 flex flex-col items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        >
          <span className="text-[9px] text-gray-700 font-mono uppercase tracking-widest">Scroll to explore</span>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ArrowDown size={14} className="text-gray-700" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ─── TICKER ─── */}
      <section className="py-6 border-y border-white/[0.03] relative z-[1]">
        <Ticker />
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="landing-section relative z-[1]">
        <Reveal className="text-center mb-14">
          <div className="landing-section-badge"><Layers size={10} className="text-purple-400" /><span>Core Features</span></div>
          <h2 className="landing-section-title">Everything you need to <span className="landing-gradient-text-purple">twin your infrastructure</span></h2>
          <p className="landing-section-sub">From visual design to chaos engineering — understand how your systems behave under real-world pressure.</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-5xl mx-auto">
          <FeatureCard icon={MousePointerClick} title="Drag & Drop Builder" description="Drag microservices, databases, caches, and queues onto an infinite zoomable canvas. Connect them visually to define dependencies." color="#3b82f6" delay={0} />
          <FeatureCard icon={FileCode} title="Config Generation" description="Auto-generate Docker Compose, Kubernetes YAML, and Terraform configs from your architecture graph. One click, production-ready." color="#06b6d4" delay={0.06} />
          <FeatureCard icon={Gauge} title="Live Simulation" description="Tick-based engine models realistic traffic, CPU, memory, latency and throughput. Watch metrics stream in real-time via WebSocket." color="#10b981" delay={0.12} />
          <FeatureCard icon={Flame} title="Chaos Engineering" description="Inject service crashes, network partitions, latency spikes, and resource exhaustion. Observe cascading failure propagation through BFS traversal." color="#ef4444" delay={0.06} />
          <FeatureCard icon={BarChart3} title="Observability" description="Real-time Recharts dashboards for every metric, structured log viewer with severity filtering, and threshold-based intelligent alerts." color="#f59e0b" delay={0.12} />
          <FeatureCard icon={Brain} title="AI Root Cause Analysis" description="After simulation, AI analyzes the failure cascade, generates a detailed root cause report, and provides actionable infrastructure recommendations." color="#8b5cf6" delay={0.18} />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="landing-section relative z-[1]">
        <Reveal className="text-center mb-14">
          <div className="landing-section-badge"><Play size={10} className="text-cyan-400" /><span>Workflow</span></div>
          <h2 className="landing-section-title">From design to <span className="landing-gradient-text">destruction</span> in minutes</h2>
          <p className="landing-section-sub">A complete lifecycle for understanding distributed systems before production.</p>
        </Reveal>

        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { n: '01', icon: GitBranch, title: 'Design Architecture', desc: 'Drag components onto the canvas and connect them to define service dependencies and traffic flow.', color: '#3b82f6' },
            { n: '02', icon: Cpu, title: 'Configure Components', desc: 'Set replicas, CPU limits, memory, eviction policies — every component mirrors real infrastructure parameters.', color: '#8b5cf6' },
            { n: '03', icon: Activity, title: 'Run Simulation', desc: 'Launch with 100 to 10,000 simulated users. Traffic flows through your graph while metrics stream live.', color: '#10b981' },
            { n: '04', icon: Flame, title: 'Inject Chaos & Analyze', desc: 'Kill services, partition networks, exhaust resources. Then let AI explain exactly what went wrong and how to fix it.', color: '#ef4444' },
          ].map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.n} delay={i * 0.08}>
                <div className="landing-step-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold font-mono border" style={{ backgroundColor: `${step.color}08`, color: step.color, borderColor: `${step.color}20` }}>
                      {step.n}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon size={14} style={{ color: step.color }} />
                      <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                    </div>
                  </div>
                  <p className="text-[12.5px] text-gray-500 leading-relaxed pl-[52px]">{step.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ─── LIVE PREVIEW ─── */}
      <section id="preview" className="landing-section relative z-[1]">
        <Reveal className="text-center mb-14">
          <div className="landing-section-badge"><Terminal size={10} className="text-green-400" /><span>Live Preview</span></div>
          <h2 className="landing-section-title">See it <span className="landing-gradient-text-green">in action</span></h2>
          <p className="landing-section-sub">Real config generation and live streaming metrics — not mockups.</p>
        </Reveal>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Reveal delay={0}>
            <div>
              <h4 className="text-[11px] font-mono text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <FileCode size={12} className="text-cyan-400" /> Config Generation
              </h4>
              <AnimatedTerminal />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <h4 className="text-[11px] font-mono text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BarChart3 size={12} className="text-purple-400" /> Real-Time Metrics
              </h4>
              <MetricsPreview />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="landing-section border-y border-white/[0.03] py-16 relative z-[1]">
        <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <Reveal delay={0}><StatCounter value={20} suffix="+" label="Components" color="#06b6d4" /></Reveal>
          <Reveal delay={0.08}><StatCounter value={100} suffix="+" label="Services" color="#8b5cf6" /></Reveal>
          <Reveal delay={0.16}><StatCounter value={4} label="Failure Types" color="#ef4444" /></Reveal>
          <Reveal delay={0.24}><StatCounter value={3} label="Export Formats" color="#10b981" /></Reveal>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="landing-section pb-28 relative z-[1]">
        <Reveal>
          <div className="landing-cta">
            <div className="landing-cta-orb" />
            <div className="landing-cta-orb2" />
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit' }}>
                Ready to twin your infrastructure?
              </h2>
              <p className="text-sm text-gray-500 mb-8 max-w-md mx-auto">
                Start designing, simulating, and breaking your distributed systems — safely.
              </p>
              <button onClick={onEnterApp} className="landing-btn-primary landing-btn-lg">
                <Play size={16} /> Launch SystemTwin <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.03] py-8 px-6 relative z-[1]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Activity size={10} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-gray-600" style={{ fontFamily: 'Outfit' }}>
              System<span className="text-cyan-500/50">Twin</span>
            </span>
          </div>
          <p className="text-[10px] text-gray-700 font-mono">Infrastructure Architecture Lab</p>
        </div>
      </footer>
    </div>
  );
}

import { useState } from 'react';
import {
  X, Cloud, Server, Database, ArrowRight, ArrowLeft, Check, Loader2,
  Network, Shield, HardDrive, KeyRound, MessageSquare, Container,
  Eye, Brain, Globe, Truck, Code, DollarSign, BarChart3, FileCode,
  ShieldCheck, Wrench, Workflow, Boxes,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import { useArchitectureStore, type FlowNodeData } from '../../stores/architectureStore';
import type { Node, Edge } from '@xyflow/react';

type Provider = 'aws' | 'gcp' | 'azure';
type Environment = 'production' | 'staging' | 'development';

interface ImportResultData {
  nodes: any[];
  edges: any[];
  summary: { discovered: number; connections: number; services: string[]; provider: string; environment: string };
}

const providers: { id: Provider; name: string; description: string }[] = [
  { id: 'aws', name: 'Amazon Web Services', description: 'EC2, RDS, S3, Lambda, ECS, and more' },
  { id: 'gcp', name: 'Google Cloud Platform', description: 'Cloud Run, Cloud SQL, GCS, Pub/Sub' },
  { id: 'azure', name: 'Microsoft Azure', description: 'App Service, Azure SQL, Blob Storage' },
];

const environments: { id: Environment; label: string; description: string }[] = [
  { id: 'production', label: 'Production', description: 'Full-scale with high availability' },
  { id: 'staging', label: 'Staging', description: 'Production-like with moderate scale' },
  { id: 'development', label: 'Development', description: 'Minimal resources for dev/test' },
];

// ── Category definitions with icons, descriptions, and visual grouping ──

interface CategoryDef {
  id: string;
  label: string;
  description: string;
  icon: typeof Cloud;
}

interface CategoryGroup {
  title: string;
  categories: CategoryDef[];
}

const categoryGroups: CategoryGroup[] = [
  {
    title: 'Core Infrastructure',
    categories: [
      { id: 'compute', label: 'Compute', description: 'Virtual machines, serverless functions, containers, Kubernetes', icon: Server },
      { id: 'storage', label: 'Storage', description: 'Object storage, block storage, file systems', icon: HardDrive },
      { id: 'databases', label: 'Databases', description: 'SQL, NoSQL, data warehouse, in-memory cache', icon: Database },
      { id: 'networking', label: 'Networking', description: 'Load balancers, DNS, CDN, WAF, VPN', icon: Network },
    ],
  },
  {
    title: 'Containers & Messaging',
    categories: [
      { id: 'containers', label: 'Containers', description: 'Container registries, service mesh', icon: Container },
      { id: 'messaging', label: 'Messaging', description: 'Message queues, event buses, workflow orchestration', icon: MessageSquare },
      { id: 'api', label: 'API', description: 'API gateways, GraphQL, integration', icon: Globe },
    ],
  },
  {
    title: 'Security & Observability',
    categories: [
      { id: 'security', label: 'Security', description: 'IAM, auth, secrets, encryption, threat detection', icon: Shield },
      { id: 'observability', label: 'Observability', description: 'Metrics, logging, distributed tracing', icon: Eye },
      { id: 'cdn_security', label: 'CDN Security', description: 'Global load balancing, DDoS protection', icon: ShieldCheck },
    ],
  },
  {
    title: 'Data & AI',
    categories: [
      { id: 'data_engineering', label: 'Data Engineering', description: 'Streaming, ETL, batch processing', icon: Workflow },
      { id: 'ai_ml', label: 'AI / ML', description: 'Machine learning, AI APIs, computer vision', icon: Brain },
      { id: 'analytics', label: 'Analytics', description: 'BI dashboards, search engines', icon: BarChart3 },
    ],
  },
  {
    title: 'DevOps & Tooling',
    categories: [
      { id: 'devops', label: 'DevOps', description: 'CI/CD build, deploy, and pipeline services', icon: Boxes },
      { id: 'devops_tools', label: 'DevOps Tools', description: 'CI/CD, monitoring, GitOps, service mesh', icon: Wrench },
      { id: 'iac', label: 'IaC', description: 'Infrastructure as Code templates and tools', icon: FileCode },
    ],
  },
  {
    title: 'Platform & Migration',
    categories: [
      { id: 'developer', label: 'Developer', description: 'Full-stack platforms, mobile testing', icon: Code },
      { id: 'hybrid', label: 'Hybrid', description: 'Hybrid cloud, edge computing, on-premises', icon: Cloud },
      { id: 'migration', label: 'Migration', description: 'Database and application migration services', icon: Truck },
      { id: 'cost_management', label: 'Cost Management', description: 'Cloud cost analysis and billing reports', icon: DollarSign },
    ],
  },
];

// Flat list of all category IDs for select-all logic
const allCategoryIds = categoryGroups.flatMap(g => g.categories.map(c => c.id));

export default function InfraImportModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [environment, setEnvironment] = useState<Environment>('production');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { loadArchitecture } = useArchitectureStore();

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedServices.length === allCategoryIds.length) {
      setSelectedServices([]);
    } else {
      setSelectedServices([...allCategoryIds]);
    }
  };

  const handleDiscover = async () => {
    if (!provider || selectedServices.length === 0) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/import/discover', {
        method: 'POST',
        body: JSON.stringify({ provider, environment, services: selectedServices }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Import failed');
      }
      const data = await res.json();
      setResult(data);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Discovery failed');
    }
    setLoading(false);
  };

  const handleLoadToCanvas = () => {
    if (!result) return;
    const flowNodes: Node<FlowNodeData>[] = result.nodes.map((n: any) => ({
      id: n.id,
      type: n.category,
      position: n.position,
      data: {
        label: n.label,
        componentType: n.type,
        category: n.category,
        config: n.config,
        status: 'healthy' as const,
        icon: '',
      },
    }));
    const flowEdges: Edge[] = result.edges.map((e: any) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: 'animated',
      animated: true,
    }));
    loadArchitecture(flowNodes, flowEdges);
    onClose();
  };

  const canGoNext = () => {
    if (step === 1) return !!provider;
    if (step === 2) return !!environment;
    if (step === 3) return selectedServices.length > 0;
    return false;
  };

  const getProviderColor = (id: Provider) => {
    switch (id) {
      case 'aws': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
      case 'gcp': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'azure': return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
    }
  };

  const getProviderSelectedColor = (id: Provider) => {
    switch (id) {
      case 'aws': return 'border-orange-500 bg-orange-500/20 ring-1 ring-orange-500/40';
      case 'gcp': return 'border-blue-500 bg-blue-500/20 ring-1 ring-blue-500/40';
      case 'azure': return 'border-sky-500 bg-sky-500/20 ring-1 ring-sky-500/40';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface-800 border border-border rounded-xl w-[680px] max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Cloud size={16} className="text-cyan-400" />
            <span className="text-sm font-semibold text-white">Import Cloud Infrastructure</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    s === step ? 'bg-cyan-400' : s < step ? 'bg-cyan-400/40' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
            <button onClick={onClose} className="p-1 hover:bg-surface-600 rounded transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Step 1: Provider Selection */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-medium text-gray-200 mb-1">Select Cloud Provider</h3>
              <p className="text-xs text-gray-500 mb-4">Choose the cloud provider to discover infrastructure from</p>
              <div className="space-y-2">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-all text-left ${
                      provider === p.id
                        ? getProviderSelectedColor(p.id)
                        : 'border-border hover:border-gray-600 hover:bg-surface-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getProviderColor(p.id)}`}>
                      <Cloud size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">{p.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.description}</p>
                    </div>
                    {provider === p.id && (
                      <Check size={16} className="text-cyan-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Environment */}
          {step === 2 && (
            <div>
              <h3 className="text-sm font-medium text-gray-200 mb-1">Select Environment</h3>
              <p className="text-xs text-gray-500 mb-4">This affects replica counts and resource scaling</p>
              <div className="space-y-2">
                {environments.map((env) => (
                  <button
                    key={env.id}
                    onClick={() => setEnvironment(env.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-lg border transition-all text-left ${
                      environment === env.id
                        ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                        : 'border-border hover:border-gray-600 hover:bg-surface-700'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      environment === env.id ? 'bg-cyan-500/20 text-cyan-400' : 'bg-surface-600 text-gray-400'
                    }`}>
                      <Shield size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-200">{env.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{env.description}</p>
                    </div>
                    {environment === env.id && (
                      <Check size={16} className="text-cyan-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Service Categories (grouped) */}
          {step === 3 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium text-gray-200">Select Services to Discover</h3>
                <button
                  onClick={selectAll}
                  className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {selectedServices.length === allCategoryIds.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Choose which service categories to scan ({selectedServices.length} of {allCategoryIds.length} selected)
              </p>

              <div className="space-y-4">
                {categoryGroups.map((group) => (
                  <div key={group.title}>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">{group.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedServices.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            onClick={() => toggleService(cat.id)}
                            className={`flex items-start gap-3 px-3.5 py-2.5 rounded-lg border transition-all text-left ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500/30'
                                : 'border-border hover:border-gray-600 hover:bg-surface-700'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-surface-600 text-gray-400'
                            }`}>
                              <Icon size={14} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-sm leading-tight block ${isSelected ? 'text-gray-200 font-medium' : 'text-gray-400'}`}>
                                {cat.label}
                              </span>
                              <span className="text-[10px] text-gray-600 leading-tight block mt-0.5">{cat.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-400 mt-3">{error}</p>
              )}
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && result && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Check size={16} className="text-green-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-200">Discovery Complete</h3>
                  <p className="text-xs text-gray-500">
                    Found {result.summary.discovered} resources across {result.summary.services.length} service categories
                  </p>
                </div>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-surface-700 rounded-lg px-3 py-2.5 border border-border">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Provider</p>
                  <p className="text-sm font-medium text-gray-200 mt-0.5 capitalize">{result.summary.provider}</p>
                </div>
                <div className="bg-surface-700 rounded-lg px-3 py-2.5 border border-border">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Environment</p>
                  <p className="text-sm font-medium text-gray-200 mt-0.5 capitalize">{result.summary.environment}</p>
                </div>
                <div className="bg-surface-700 rounded-lg px-3 py-2.5 border border-border">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Resources</p>
                  <p className="text-sm font-medium text-cyan-400 mt-0.5">{result.summary.discovered}</p>
                </div>
                <div className="bg-surface-700 rounded-lg px-3 py-2.5 border border-border">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Connections</p>
                  <p className="text-sm font-medium text-cyan-400 mt-0.5">{result.summary.connections}</p>
                </div>
              </div>

              {/* Discovered resources list */}
              <div className="bg-surface-900 rounded-lg border border-border p-3 max-h-[220px] overflow-y-auto">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Discovered Resources</p>
                <div className="space-y-1">
                  {result.nodes.map((n: any) => (
                    <div key={n.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      <span className="text-xs text-gray-300 flex-1">{n.label}</span>
                      <span className="text-[10px] text-gray-600 capitalize">{n.category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <div>
            {step > 1 && step < 4 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-surface-700 transition-colors"
              >
                <ArrowLeft size={12} />
                Back
              </button>
            )}
            {step === 4 && (
              <button
                onClick={() => { setStep(1); setResult(null); setError(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-surface-700 transition-colors"
              >
                <ArrowLeft size={12} />
                Start Over
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-surface-700 border border-border transition-colors"
            >
              Cancel
            </button>
            {step < 3 && (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight size={12} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleDiscover}
                disabled={!canGoNext() || loading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Discovering...
                  </>
                ) : (
                  <>
                    <Cloud size={12} />
                    Discover Infrastructure
                  </>
                )}
              </button>
            )}
            {step === 4 && (
              <button
                onClick={handleLoadToCanvas}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
              >
                <Check size={12} />
                Load to Canvas
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

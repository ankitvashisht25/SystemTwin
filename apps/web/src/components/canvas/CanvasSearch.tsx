import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useArchitectureStore } from '../../stores/architectureStore';
import { useReactFlow } from '@xyflow/react';

export default function CanvasSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const nodes = useArchitectureStore((s) => s.nodes);
  const setSelectedNode = useArchitectureStore((s) => s.setSelectedNode);
  const { setCenter } = useReactFlow();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return nodes.filter(n =>
      n.data.label.toLowerCase().includes(q) ||
      n.data.componentType.toLowerCase().includes(q) ||
      n.data.category.toLowerCase().includes(q)
    );
  }, [query, nodes]);

  const handleSelect = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(nodeId);
      setCenter(node.position.x + 75, node.position.y + 40, { zoom: 1.5, duration: 500 });
    }
    setQuery('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 left-3 z-10 p-2 bg-surface-800/90 border border-border rounded-lg hover:bg-surface-700 transition-colors backdrop-blur-sm"
        title="Search components (Ctrl+F)"
      >
        <Search size={14} className="text-gray-400" />
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-3 z-10 w-72">
      <div className="bg-surface-800/95 border border-border rounded-lg backdrop-blur-sm overflow-hidden shadow-xl">
        <div className="flex items-center px-3 gap-2 border-b border-border">
          <Search size={14} className="text-gray-500 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setIsOpen(false); setQuery(''); }
              if (e.key === 'Enter' && results.length > 0) handleSelect(results[0].id);
            }}
            placeholder="Search components..."
            className="flex-1 bg-transparent py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none"
          />
          <button onClick={() => { setIsOpen(false); setQuery(''); }} className="text-gray-500 hover:text-white">
            <X size={14} />
          </button>
        </div>
        {query && results.length > 0 && (
          <div className="max-h-48 overflow-y-auto">
            {results.map(n => (
              <button
                key={n.id}
                onClick={() => handleSelect(n.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-700 transition-colors text-left"
              >
                <span className="text-white">{n.data.label}</span>
                <span className="text-gray-500 capitalize">{n.data.componentType.replace(/-/g, ' ')}</span>
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div className="px-3 py-3 text-xs text-gray-500">No components found</div>
        )}
      </div>
    </div>
  );
}

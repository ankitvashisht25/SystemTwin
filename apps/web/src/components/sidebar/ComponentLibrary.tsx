import { type DragEvent, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { componentLibrary, categoryLabels, categoryColors } from '@systemtwin/shared';
import type { ComponentDefinition } from '@systemtwin/shared';

const iconMap: Record<string, React.ComponentType<any>> = {
  Globe: Icons.Globe, Smartphone: Icons.Smartphone, Cloud: Icons.Cloud,
  Server: Icons.Server, Shield: Icons.Shield, Cog: Icons.Cog,
  ArrowLeftRight: Icons.ArrowLeftRight, Database: Icons.Database,
  Zap: Icons.Zap, MailPlus: Icons.Mail, Split: Icons.Split,
  Network: Icons.Network, Repeat: Icons.Repeat, FileText: Icons.FileText,
  GitBranch: Icons.GitBranch, Radio: Icons.Radio, Clock: Icons.Clock,
  Bell: Icons.Bell, Search: Icons.Search, Layers: Icons.Layers,
  Megaphone: Icons.Megaphone, Globe2: Icons.Globe2, ShieldCheck: Icons.ShieldCheck,
  Waypoints: Icons.Waypoints, HardDrive: Icons.HardDrive, Box: Icons.Box,
  Monitor: Icons.Monitor, Sparkles: Icons.Sparkles, Cylinder: Icons.Cylinder,
  Container: Icons.Container, Workflow: Icons.Workflow, Inbox: Icons.Inbox,
  Orbit: Icons.Orbit, KeyRound: Icons.KeyRound, Route: Icons.Route,
};

function ComponentItem({ component }: { component: ComponentDefinition }) {
  const Icon = iconMap[component.icon] || Icons.Server;
  const color = categoryColors[component.category];

  const onDragStart = useCallback((e: DragEvent) => {
    e.dataTransfer.setData('application/systemtwin-component', JSON.stringify(component));
    e.dataTransfer.effectAllowed = 'move';
  }, [component]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="flex items-center gap-2.5 px-3 py-2 rounded-md cursor-grab active:cursor-grabbing hover:bg-surface-600 transition-colors group"
    >
      <div
        className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${color}20`, color }}
      >
        <Icon size={14} />
      </div>
      <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
        {component.label}
      </span>
    </div>
  );
}

export default function ComponentLibrary() {
  const categories = Object.keys(categoryLabels);

  return (
    <div className="p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3 px-1">
        Components
      </h2>
      {categories.map((cat) => {
        const items = componentLibrary.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="mb-4">
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest mb-1.5 px-1"
              style={{ color: categoryColors[cat] }}
            >
              {categoryLabels[cat]}
            </h3>
            <div className="space-y-0.5">
              {items.map((item) => (
                <ComponentItem key={item.type} component={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

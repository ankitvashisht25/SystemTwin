import type { ComponentType, NodeCategory } from './architecture.js';

export interface ComponentDefinition {
  type: ComponentType;
  category: NodeCategory;
  label: string;
  icon: string;
  defaultConfig: Record<string, unknown>;
  configSchema: ConfigField[];
}

export interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean';
  options?: string[];
  defaultValue: unknown;
  unit?: string;
}

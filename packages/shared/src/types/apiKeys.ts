export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  active: boolean;
  createdAt: string;
}

export type WebhookEvent =
  | 'architecture.created'
  | 'architecture.updated'
  | 'architecture.deleted'
  | 'simulation.started'
  | 'simulation.completed'
  | 'simulation.failure_injected';

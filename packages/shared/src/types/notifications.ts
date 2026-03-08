export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'architecture.shared'
  | 'team.invited'
  | 'team.role_changed'
  | 'simulation.completed'
  | 'sla.violated'
  | 'comment.added'
  | 'version.restored'
  | 'system.announcement';

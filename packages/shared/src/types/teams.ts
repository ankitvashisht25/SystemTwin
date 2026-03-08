export interface Team {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  userName: string;
  userEmail: string;
  joinedAt: string;
}

export type TeamRole = 'owner' | 'admin' | 'member';

export interface ArchitecturePermission {
  id: string;
  architectureId: string;
  teamId?: string;
  userId?: string;
  permission: PermissionLevel;
  grantedBy: string;
  grantedAt: string;
}

export type PermissionLevel = 'owner' | 'editor' | 'viewer';

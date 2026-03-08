import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../services/auth.js';
import { checkPermission } from '../services/permissions.js';
import type { PermissionLevel, TeamRole } from '@systemtwin/shared';
import { getTeamRole } from '../services/teams.js';

const permissionHierarchy: Record<PermissionLevel, number> = { owner: 3, editor: 2, viewer: 1 };

export function requirePermission(requiredLevel: PermissionLevel) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const architectureId = String(req.params.id);
    if (!architectureId) { res.status(400).json({ error: 'Architecture ID required' }); return; }

    const level = checkPermission(req.user!.userId, architectureId);
    if (!level || permissionHierarchy[level] < permissionHierarchy[requiredLevel]) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

export function requireTeamRole(requiredRole: TeamRole) {
  const roleHierarchy: Record<TeamRole, number> = { owner: 3, admin: 2, member: 1 };

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const teamId = String(req.params.id);
    if (!teamId) { res.status(400).json({ error: 'Team ID required' }); return; }

    const role = getTeamRole(teamId, req.user!.userId);
    if (!role || roleHierarchy[role] < roleHierarchy[requiredRole]) {
      res.status(403).json({ error: 'Insufficient team permissions' });
      return;
    }
    next();
  };
}

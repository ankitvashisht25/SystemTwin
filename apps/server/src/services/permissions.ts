import db from './database.js';
import type { PermissionLevel } from '@systemtwin/shared';

export function checkPermission(userId: string, architectureId: string): PermissionLevel | null {
  // Check direct ownership
  const arch = db.prepare(
    'SELECT user_id FROM architectures WHERE id = ?'
  ).get(architectureId) as { user_id: string } | undefined;

  if (!arch) return null;
  if (arch.user_id === userId) return 'owner';

  // Check direct user permission
  const directPerm = db.prepare(
    'SELECT permission FROM architecture_permissions WHERE architecture_id = ? AND user_id = ?'
  ).get(architectureId, userId) as { permission: PermissionLevel } | undefined;

  if (directPerm) return directPerm.permission;

  // Check team-based permission
  const teamPerm = db.prepare(`
    SELECT ap.permission FROM architecture_permissions ap
    JOIN team_members tm ON tm.team_id = ap.team_id
    WHERE ap.architecture_id = ? AND tm.user_id = ?
    ORDER BY CASE ap.permission WHEN 'owner' THEN 1 WHEN 'editor' THEN 2 WHEN 'viewer' THEN 3 END
    LIMIT 1
  `).get(architectureId, userId) as { permission: PermissionLevel } | undefined;

  return teamPerm?.permission || null;
}

export function hasPermission(userId: string, architectureId: string, requiredLevel: PermissionLevel): boolean {
  const level = checkPermission(userId, architectureId);
  if (!level) return false;

  const hierarchy: Record<PermissionLevel, number> = { owner: 3, editor: 2, viewer: 1 };
  return hierarchy[level] >= hierarchy[requiredLevel];
}

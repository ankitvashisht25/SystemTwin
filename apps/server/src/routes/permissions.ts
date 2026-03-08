import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import { checkPermission } from '../services/permissions.js';
import db from '../services/database.js';

const router = Router();
router.use(authMiddleware);

// GET /api/architecture/:id/permissions
router.get('/:id/permissions', (req: AuthRequest, res) => {
  const perm = checkPermission(req.user!.userId, String(req.params.id));
  if (!perm) { res.status(403).json({ error: 'Access denied' }); return; }

  const perms = db.prepare(`
    SELECT ap.*, u.name as user_name, u.email as user_email, t.name as team_name
    FROM architecture_permissions ap
    LEFT JOIN users u ON u.id = ap.user_id
    LEFT JOIN teams t ON t.id = ap.team_id
    WHERE ap.architecture_id = ?
  `).all(String(req.params.id)) as Array<{
    id: string; architecture_id: string; team_id: string; user_id: string;
    permission: string; granted_by: string; granted_at: string;
    user_name: string; user_email: string; team_name: string;
  }>;

  res.json(perms.map((p) => ({
    id: p.id, architectureId: p.architecture_id,
    teamId: p.team_id, userId: p.user_id,
    permission: p.permission, grantedBy: p.granted_by, grantedAt: p.granted_at,
    userName: p.user_name, userEmail: p.user_email, teamName: p.team_name,
  })));
});

// POST /api/architecture/:id/permissions
router.post('/:id/permissions', (req: AuthRequest, res) => {
  const perm = checkPermission(req.user!.userId, String(req.params.id));
  if (perm !== 'owner') { res.status(403).json({ error: 'Only owners can grant permissions' }); return; }

  const { teamId, userId, permission } = req.body;
  if (!teamId && !userId) { res.status(400).json({ error: 'Either teamId or userId is required' }); return; }
  if (!['owner', 'editor', 'viewer'].includes(permission)) {
    res.status(400).json({ error: 'Invalid permission level' });
    return;
  }

  const id = uuid();
  db.prepare(
    'INSERT INTO architecture_permissions (id, architecture_id, team_id, user_id, permission, granted_by) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, String(req.params.id), teamId || null, userId || null, permission, req.user!.userId);

  res.status(201).json({ id, architectureId: String(req.params.id), teamId, userId, permission });
});

// DELETE /api/architecture/:id/permissions/:permId
router.delete('/:id/permissions/:permId', (req: AuthRequest, res) => {
  const perm = checkPermission(req.user!.userId, String(req.params.id));
  if (perm !== 'owner') { res.status(403).json({ error: 'Only owners can revoke permissions' }); return; }

  const result = db.prepare('DELETE FROM architecture_permissions WHERE id = ? AND architecture_id = ?')
    .run(String(req.params.permId), String(req.params.id));
  if (result.changes === 0) { res.status(404).json({ error: 'Permission not found' }); return; }
  res.status(204).end();
});

// GET /api/architecture/shared - List architectures shared with user
router.get('/shared/with-me', (req: AuthRequest, res) => {
  const rows = db.prepare(`
    SELECT DISTINCT a.id, a.name, a.nodes, a.edges, a.thumbnail, a.created_at, a.updated_at,
      COALESCE(ap_direct.permission, ap_team.permission) as permission
    FROM architectures a
    LEFT JOIN architecture_permissions ap_direct ON ap_direct.architecture_id = a.id AND ap_direct.user_id = ?
    LEFT JOIN architecture_permissions ap_team ON ap_team.architecture_id = a.id
      AND ap_team.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)
    WHERE a.user_id != ? AND (ap_direct.id IS NOT NULL OR ap_team.id IS NOT NULL)
    ORDER BY a.updated_at DESC
  `).all(req.user!.userId, req.user!.userId, req.user!.userId) as Array<{
    id: string; name: string; nodes: string; edges: string; thumbnail: string;
    created_at: string; updated_at: string; permission: string;
  }>;

  res.json(rows.map((r) => ({
    id: r.id, name: r.name, nodes: JSON.parse(r.nodes), edges: JSON.parse(r.edges),
    thumbnail: r.thumbnail, createdAt: r.created_at, updatedAt: r.updated_at,
    permission: r.permission,
  })));
});

export { router as permissionsRouter };

import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import db from '../services/database.js';

const router = Router();
router.use(authMiddleware);

// GET /api/activity - User's activity feed
router.get('/', (req: AuthRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const rows = db.prepare(`
    SELECT al.*, u.name as user_name, a.name as arch_name
    FROM activity_log al
    JOIN users u ON u.id = al.user_id
    LEFT JOIN architectures a ON a.id = al.architecture_id
    WHERE al.user_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(req.user!.userId, limit) as Array<{
    id: string; architecture_id: string; user_id: string;
    action: string; details: string; created_at: string;
    user_name: string; arch_name: string;
  }>;

  res.json(rows.map(r => ({
    id: r.id,
    architectureId: r.architecture_id,
    userId: r.user_id,
    userName: r.user_name,
    architectureName: r.arch_name,
    action: r.action,
    details: r.details,
    createdAt: r.created_at,
  })));
});

// GET /api/activity/:architectureId - Architecture-specific activity
router.get('/:architectureId', (req: AuthRequest, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const rows = db.prepare(`
    SELECT al.*, u.name as user_name
    FROM activity_log al
    JOIN users u ON u.id = al.user_id
    WHERE al.architecture_id = ?
    ORDER BY al.created_at DESC
    LIMIT ?
  `).all(String(req.params.architectureId), limit) as Array<{
    id: string; architecture_id: string; user_id: string;
    action: string; details: string; created_at: string;
    user_name: string;
  }>;

  res.json(rows.map(r => ({
    id: r.id,
    architectureId: r.architecture_id,
    userId: r.user_id,
    userName: r.user_name,
    action: r.action,
    details: r.details,
    createdAt: r.created_at,
  })));
});

export { router as activityRouter };

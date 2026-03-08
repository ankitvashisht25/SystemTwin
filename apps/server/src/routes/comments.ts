import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import db from '../services/database.js';

const router = Router();
router.use(authMiddleware);

// GET /api/comments/:architectureId
router.get('/:architectureId', (req: AuthRequest, res) => {
  const rows = db.prepare(`
    SELECT c.*, u.name as user_name, u.email as user_email
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.architecture_id = ?
    ORDER BY c.created_at ASC
  `).all(String(req.params.architectureId)) as Array<{
    id: string; architecture_id: string; node_id: string; user_id: string;
    content: string; created_at: string; updated_at: string;
    user_name: string; user_email: string;
  }>;

  res.json(rows.map(r => ({
    id: r.id,
    architectureId: r.architecture_id,
    nodeId: r.node_id,
    userId: r.user_id,
    content: r.content,
    userName: r.user_name,
    userEmail: r.user_email,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  })));
});

// POST /api/comments/:architectureId
router.post('/:architectureId', (req: AuthRequest, res) => {
  const { content, nodeId } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }

  const id = uuid();
  db.prepare(
    'INSERT INTO comments (id, architecture_id, node_id, user_id, content) VALUES (?, ?, ?, ?, ?)'
  ).run(id, String(req.params.architectureId), nodeId || null, req.user!.userId, content);

  res.status(201).json({
    id,
    architectureId: String(req.params.architectureId),
    nodeId: nodeId || null,
    content,
    userId: req.user!.userId,
    createdAt: new Date().toISOString(),
  });
});

// DELETE /api/comments/:architectureId/:commentId
router.delete('/:architectureId/:commentId', (req: AuthRequest, res) => {
  const result = db.prepare(
    'DELETE FROM comments WHERE id = ? AND user_id = ?'
  ).run(String(req.params.commentId), req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }

  res.status(204).end();
});

export { router as commentsRouter };

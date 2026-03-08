import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import db from '../services/database.js';

const router = Router();

// POST /api/embeds - Create embed link (auth required)
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { architectureId, allowInteraction } = req.body;
  if (!architectureId) { res.status(400).json({ error: 'Architecture ID is required' }); return; }

  const id = uuid();
  db.prepare(
    'INSERT INTO embeds (id, architecture_id, user_id, allow_interaction) VALUES (?, ?, ?, ?)'
  ).run(id, architectureId, req.user!.userId, allowInteraction ? 1 : 0);

  res.status(201).json({ id, embedUrl: `/embed/${id}` });
});

// GET /api/embeds/:id - Get embed data (public, no auth)
router.get('/:id', (req, res) => {
  const embed = db.prepare(`
    SELECT e.*, a.name, a.nodes, a.edges
    FROM embeds e JOIN architectures a ON a.id = e.architecture_id
    WHERE e.id = ?
  `).get(String(req.params.id)) as {
    id: string; architecture_id: string; allow_interaction: number;
    name: string; nodes: string; edges: string;
  } | undefined;

  if (!embed) { res.status(404).json({ error: 'Embed not found' }); return; }

  res.json({
    id: embed.id,
    architectureName: embed.name,
    nodes: JSON.parse(embed.nodes),
    edges: JSON.parse(embed.edges),
    allowInteraction: !!embed.allow_interaction,
  });
});

// DELETE /api/embeds/:id - Delete embed (auth required)
router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM embeds WHERE id = ? AND user_id = ?')
    .run(String(req.params.id), req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Embed not found' }); return; }
  res.status(204).end();
});

// GET /api/embeds/mine - List user's embeds (auth required)
router.get('/mine/list', authMiddleware, (req: AuthRequest, res) => {
  const rows = db.prepare(`
    SELECT e.id, e.architecture_id, e.allow_interaction, e.created_at, a.name
    FROM embeds e JOIN architectures a ON a.id = e.architecture_id
    WHERE e.user_id = ?
  `).all(req.user!.userId) as Array<{
    id: string; architecture_id: string; allow_interaction: number;
    created_at: string; name: string;
  }>;

  res.json(rows.map(r => ({
    id: r.id, architectureId: r.architecture_id, architectureName: r.name,
    allowInteraction: !!r.allow_interaction, createdAt: r.created_at,
    embedUrl: `/embed/${r.id}`,
  })));
});

export { router as embedsRouter };

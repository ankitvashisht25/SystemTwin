import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import db from '../services/database.js';

const router = Router();

// GET /api/marketplace - Browse public templates
router.get('/', (_req, res) => {
  const sort = (_req.query.sort as string) || 'downloads';
  const category = _req.query.category as string;
  const search = _req.query.search as string;

  let query = `
    SELECT mt.*, u.name as author_name
    FROM marketplace_templates mt JOIN users u ON u.id = mt.author_id
    WHERE mt.is_public = 1
  `;
  const params: unknown[] = [];

  if (category) { query += ' AND mt.category = ?'; params.push(category); }
  if (search) { query += ' AND (mt.name LIKE ? OR mt.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

  if (sort === 'rating') query += ' ORDER BY mt.rating DESC';
  else if (sort === 'newest') query += ' ORDER BY mt.created_at DESC';
  else query += ' ORDER BY mt.downloads DESC';

  query += ' LIMIT 50';

  const rows = db.prepare(query).all(...params) as Array<{
    id: string; name: string; description: string; category: string;
    author_id: string; author_name: string; nodes: string; edges: string;
    tags: string; downloads: number; rating: number; rating_count: number;
    is_public: number; created_at: string; updated_at: string;
  }>;

  res.json(rows.map(r => ({
    id: r.id, name: r.name, description: r.description, category: r.category,
    authorId: r.author_id, authorName: r.author_name,
    nodeCount: JSON.parse(r.nodes).length, edgeCount: JSON.parse(r.edges).length,
    tags: JSON.parse(r.tags), downloads: r.downloads,
    rating: r.rating, ratingCount: r.rating_count,
    createdAt: r.created_at, updatedAt: r.updated_at,
  })));
});

// GET /api/marketplace/:id - Get full template
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT mt.*, u.name as author_name FROM marketplace_templates mt
    JOIN users u ON u.id = mt.author_id WHERE mt.id = ?
  `).get(String(req.params.id)) as { id: string; nodes: string; edges: string; [key: string]: unknown } | undefined;

  if (!row) { res.status(404).json({ error: 'Template not found' }); return; }

  // Increment downloads
  db.prepare('UPDATE marketplace_templates SET downloads = downloads + 1 WHERE id = ?').run(String(req.params.id));

  res.json({ ...row, nodes: JSON.parse(row.nodes as string), edges: JSON.parse(row.edges as string), tags: JSON.parse(row.tags as string || '[]') });
});

// POST /api/marketplace - Publish a template (auth required)
router.post('/', authMiddleware, (req: AuthRequest, res) => {
  const { name, description, category, nodes, edges, tags } = req.body;
  if (!name || !nodes) { res.status(400).json({ error: 'Name and nodes are required' }); return; }

  const id = uuid();
  db.prepare(
    'INSERT INTO marketplace_templates (id, name, description, category, author_id, nodes, edges, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, name, description || '', category || 'general', req.user!.userId,
    JSON.stringify(nodes), JSON.stringify(edges || []), JSON.stringify(tags || []));

  res.status(201).json({ id, name });
});

// POST /api/marketplace/:id/rate - Rate a template
router.post('/:id/rate', authMiddleware, (req: AuthRequest, res) => {
  const { rating, review } = req.body;
  if (!rating || rating < 1 || rating > 5) { res.status(400).json({ error: 'Rating must be 1-5' }); return; }

  const id = uuid();
  try {
    db.prepare(
      'INSERT INTO template_ratings (id, template_id, user_id, rating, review) VALUES (?, ?, ?, ?, ?)'
    ).run(id, String(req.params.id), req.user!.userId, rating, review || '');
  } catch {
    // Update existing rating
    db.prepare(
      'UPDATE template_ratings SET rating = ?, review = ? WHERE template_id = ? AND user_id = ?'
    ).run(rating, review || '', String(req.params.id), req.user!.userId);
  }

  // Update aggregate rating
  const stats = db.prepare(
    'SELECT AVG(rating) as avg, COUNT(*) as count FROM template_ratings WHERE template_id = ?'
  ).get(String(req.params.id)) as { avg: number; count: number };

  db.prepare(
    'UPDATE marketplace_templates SET rating = ?, rating_count = ? WHERE id = ?'
  ).run(Math.round(stats.avg * 10) / 10, stats.count, String(req.params.id));

  res.json({ success: true });
});

// DELETE /api/marketplace/:id - Delete own template
router.delete('/:id', authMiddleware, (req: AuthRequest, res) => {
  const result = db.prepare(
    'DELETE FROM marketplace_templates WHERE id = ? AND author_id = ?'
  ).run(String(req.params.id), req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Template not found or not yours' }); return; }
  res.status(204).end();
});

export { router as marketplaceRouter };

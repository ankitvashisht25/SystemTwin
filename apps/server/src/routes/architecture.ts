import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../services/database.js';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import { createVersion } from '../services/versioning.js';
import { logActivity } from '../services/activityLogger.js';

const router = Router();

// All architecture routes require auth
router.use(authMiddleware);

// List user's architectures
router.get('/', (req: AuthRequest, res) => {
  const rows = db.prepare(
    'SELECT id, name, nodes, edges, thumbnail, created_at, updated_at FROM architectures WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.user!.userId) as any[];

  const architectures = rows.map((r) => ({
    id: r.id,
    name: r.name,
    nodes: JSON.parse(r.nodes),
    edges: JSON.parse(r.edges),
    thumbnail: r.thumbnail || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  res.json(architectures);
});

// Get single architecture
router.get('/:id', (req: AuthRequest, res) => {
  const row = db.prepare(
    'SELECT id, name, nodes, edges, thumbnail, created_at, updated_at FROM architectures WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId) as any;

  if (!row) {
    res.status(404).json({ error: 'Architecture not found' });
    return;
  }

  res.json({
    id: row.id,
    name: row.name,
    nodes: JSON.parse(row.nodes),
    edges: JSON.parse(row.edges),
    thumbnail: row.thumbnail || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// Create architecture
router.post('/', (req: AuthRequest, res) => {
  const id = uuid();
  const name = req.body.name || 'Untitled Architecture';
  const nodes = JSON.stringify(req.body.nodes || []);
  const edges = JSON.stringify(req.body.edges || []);

  db.prepare(
    'INSERT INTO architectures (id, user_id, name, nodes, edges) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user!.userId, name, nodes, edges);

  const row = db.prepare('SELECT * FROM architectures WHERE id = ?').get(id) as any;

  logActivity(req.user!.userId, 'architecture.created', id, name);

  res.status(201).json({
    id: row.id,
    name: row.name,
    nodes: JSON.parse(row.nodes),
    edges: JSON.parse(row.edges),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// Update architecture
router.put('/:id', (req: AuthRequest, res) => {
  const existing = db.prepare(
    'SELECT id FROM architectures WHERE id = ? AND user_id = ?'
  ).get(req.params.id, req.user!.userId);

  if (!existing) {
    res.status(404).json({ error: 'Architecture not found' });
    return;
  }

  // Auto-snapshot before update
  try { createVersion(String(req.params.id), req.user!.userId, 'Auto-snapshot'); } catch { /* ignore if first save */ }

  const updates: string[] = [];
  const values: any[] = [];

  if (req.body.name !== undefined) { updates.push('name = ?'); values.push(req.body.name); }
  if (req.body.nodes !== undefined) { updates.push('nodes = ?'); values.push(JSON.stringify(req.body.nodes)); }
  if (req.body.edges !== undefined) { updates.push('edges = ?'); values.push(JSON.stringify(req.body.edges)); }
  if (req.body.thumbnail !== undefined) { updates.push('thumbnail = ?'); values.push(req.body.thumbnail); }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  updates.push("updated_at = datetime('now')");
  values.push(req.params.id);

  db.prepare(`UPDATE architectures SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const row = db.prepare('SELECT * FROM architectures WHERE id = ?').get(req.params.id) as any;

  logActivity(req.user!.userId, 'architecture.updated', String(req.params.id));

  res.json({
    id: row.id,
    name: row.name,
    nodes: JSON.parse(row.nodes),
    edges: JSON.parse(row.edges),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
});

// Delete architecture
router.delete('/:id', (req: AuthRequest, res) => {
  const result = db.prepare(
    'DELETE FROM architectures WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: 'Architecture not found' });
    return;
  }

  logActivity(req.user!.userId, 'architecture.deleted', String(req.params.id));

  res.status(204).end();
});

export { router as architectureRouter };

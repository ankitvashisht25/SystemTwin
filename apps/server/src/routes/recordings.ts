import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import db from '../services/database.js';

const router = Router();
router.use(authMiddleware);

// POST /api/recordings - Save recording
router.post('/', (req: AuthRequest, res) => {
  const { architectureId, name, config, ticks } = req.body;
  if (!config || !ticks) {
    res.status(400).json({ error: 'Config and ticks are required' });
    return;
  }

  const id = uuid();
  db.prepare(
    'INSERT INTO simulation_recordings (id, architecture_id, user_id, name, config, tick_count, ticks) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, architectureId || null, req.user!.userId, name || 'Recording', JSON.stringify(config), ticks.length, JSON.stringify(ticks));

  res.status(201).json({ id, name: name || 'Recording', tickCount: ticks.length });
});

// GET /api/recordings - List recordings
router.get('/', (req: AuthRequest, res) => {
  const rows = db.prepare(
    'SELECT id, architecture_id, name, tick_count, created_at FROM simulation_recordings WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user!.userId) as Array<{
    id: string; architecture_id: string; name: string; tick_count: number; created_at: string;
  }>;

  res.json(rows.map((r) => ({
    id: r.id, architectureId: r.architecture_id, name: r.name,
    tickCount: r.tick_count, createdAt: r.created_at,
  })));
});

// GET /api/recordings/:id - Get recording with full data
router.get('/:id', (req: AuthRequest, res) => {
  const row = db.prepare(
    'SELECT * FROM simulation_recordings WHERE id = ? AND user_id = ?'
  ).get(String(req.params.id), req.user!.userId) as {
    id: string; architecture_id: string; user_id: string; name: string;
    config: string; tick_count: number; ticks: string; created_at: string;
  } | undefined;

  if (!row) { res.status(404).json({ error: 'Recording not found' }); return; }

  res.json({
    id: row.id, architectureId: row.architecture_id, userId: row.user_id,
    name: row.name, config: JSON.parse(row.config), tickCount: row.tick_count,
    ticks: JSON.parse(row.ticks), createdAt: row.created_at,
  });
});

// DELETE /api/recordings/:id - Delete recording
router.delete('/:id', (req: AuthRequest, res) => {
  const result = db.prepare(
    'DELETE FROM simulation_recordings WHERE id = ? AND user_id = ?'
  ).run(String(req.params.id), req.user!.userId);

  if (result.changes === 0) { res.status(404).json({ error: 'Recording not found' }); return; }
  res.status(204).end();
});

export { router as recordingsRouter };

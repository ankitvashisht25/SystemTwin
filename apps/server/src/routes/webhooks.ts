import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import db from '../services/database.js';

const router = Router();
router.use(authMiddleware);

// GET /api/webhooks - List user's webhooks
router.get('/', (req: AuthRequest, res) => {
  const rows = db.prepare(
    'SELECT id, url, events, active, created_at FROM webhooks WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user!.userId) as Array<{
    id: string; url: string; events: string; active: number; created_at: string;
  }>;
  res.json(rows.map(r => ({
    id: r.id, url: r.url, events: JSON.parse(r.events), active: !!r.active, createdAt: r.created_at,
  })));
});

// POST /api/webhooks - Create webhook
router.post('/', (req: AuthRequest, res) => {
  const { url, events } = req.body;
  if (!url || !events || !Array.isArray(events)) {
    res.status(400).json({ error: 'URL and events array are required' });
    return;
  }

  const id = uuid();
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  db.prepare(
    'INSERT INTO webhooks (id, user_id, url, events, secret) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.user!.userId, url, JSON.stringify(events), secret);

  res.status(201).json({ id, url, events, secret, active: true });
});

// PUT /api/webhooks/:id - Update webhook
router.put('/:id', (req: AuthRequest, res) => {
  const { url, events, active } = req.body;
  const updates: string[] = [];
  const values: unknown[] = [];

  if (url !== undefined) { updates.push('url = ?'); values.push(url); }
  if (events !== undefined) { updates.push('events = ?'); values.push(JSON.stringify(events)); }
  if (active !== undefined) { updates.push('active = ?'); values.push(active ? 1 : 0); }

  if (updates.length === 0) { res.status(400).json({ error: 'No fields to update' }); return; }
  values.push(String(req.params.id), req.user!.userId);

  db.prepare(`UPDATE webhooks SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...values);
  res.json({ success: true });
});

// DELETE /api/webhooks/:id - Delete webhook
router.delete('/:id', (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM webhooks WHERE id = ? AND user_id = ?')
    .run(String(req.params.id), req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Webhook not found' }); return; }
  res.status(204).end();
});

export { router as webhooksRouter };

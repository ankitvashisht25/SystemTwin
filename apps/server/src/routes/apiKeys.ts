import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import db from '../services/database.js';

const router = Router();
router.use(authMiddleware);

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// GET /api/api-keys - List user's API keys
router.get('/', (req: AuthRequest, res) => {
  const rows = db.prepare(
    'SELECT id, name, key_prefix, created_at, last_used_at, expires_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user!.userId) as Array<{
    id: string; name: string; key_prefix: string;
    created_at: string; last_used_at: string; expires_at: string;
  }>;
  res.json(rows.map(r => ({
    id: r.id, name: r.name, keyPrefix: r.key_prefix,
    createdAt: r.created_at, lastUsedAt: r.last_used_at, expiresAt: r.expires_at,
  })));
});

// POST /api/api-keys - Create new API key
router.post('/', (req: AuthRequest, res) => {
  const { name, expiresIn } = req.body;
  if (!name) { res.status(400).json({ error: 'Name is required' }); return; }

  const id = uuid();
  const rawKey = `stk_${crypto.randomBytes(32).toString('hex')}`;
  const keyPrefix = rawKey.substring(0, 12) + '...';
  const keyHash = hashKey(rawKey);
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 86400000).toISOString() : null;

  db.prepare(
    'INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, req.user!.userId, name, keyHash, keyPrefix, expiresAt);

  // Return the raw key ONLY on creation
  res.status(201).json({ id, name, key: rawKey, keyPrefix, expiresAt });
});

// DELETE /api/api-keys/:id - Revoke API key
router.delete('/:id', (req: AuthRequest, res) => {
  const result = db.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?')
    .run(String(req.params.id), req.user!.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'API key not found' }); return; }
  res.status(204).end();
});

export { router as apiKeysRouter };

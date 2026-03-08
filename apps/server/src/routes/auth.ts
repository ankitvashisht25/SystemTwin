import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../services/database.js';
import { hashPassword, verifyPassword, generateToken, authMiddleware, type AuthRequest } from '../services/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } from '../schemas/auth.js';

const router = Router();

// Register
router.post('/register', validate(registerSchema), (req, res) => {
  const { email, name, password } = req.body;

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const id = uuid();
  const passwordHash = hashPassword(password);

  db.prepare(
    'INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)'
  ).run(id, email.toLowerCase().trim(), name.trim(), passwordHash);

  const token = generateToken({ userId: id, email });

  res.status(201).json({
    token,
    user: { id, email, name: name.trim(), avatarUrl: '' },
  });
});

// Login
router.post('/login', validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare(
    'SELECT id, email, name, password_hash, avatar_url FROM users WHERE email = ?'
  ).get(email.toLowerCase().trim()) as any;

  if (!user || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken({ userId: user.id, email: user.email });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatar_url || '' },
  });
});

// Get current user
router.get('/me', authMiddleware, (req: AuthRequest, res) => {
  const user = db.prepare(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId) as any;

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url || '',
    createdAt: user.created_at,
  });
});

// Update profile
router.put('/me', authMiddleware, validate(updateProfileSchema), (req: AuthRequest, res) => {
  const { name, avatarUrl } = req.body;

  const updates: string[] = [];
  const values: any[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name.trim());
  }
  if (avatarUrl !== undefined) {
    updates.push('avatar_url = ?');
    values.push(avatarUrl);
  }

  if (updates.length === 0) {
    res.status(400).json({ error: 'No fields to update' });
    return;
  }

  updates.push("updated_at = datetime('now')");
  values.push(req.user!.userId);

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  const user = db.prepare(
    'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ?'
  ).get(req.user!.userId) as any;

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatar_url || '',
    createdAt: user.created_at,
  });
});

// Change password
router.put('/me/password', authMiddleware, validate(changePasswordSchema), (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user!.userId) as any;

  if (!verifyPassword(currentPassword, user.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }

  db.prepare(
    "UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(hashPassword(newPassword), req.user!.userId);

  res.json({ message: 'Password updated' });
});

export { router as authRouter };

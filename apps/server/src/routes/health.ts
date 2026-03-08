import { Router } from 'express';
import db from '../services/database.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

router.get('/ready', (_req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

export { router as healthRouter };

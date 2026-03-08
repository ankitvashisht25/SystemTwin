import { Router } from 'express';
import { authMiddleware } from '../services/auth.js';
import { scoreArchitecture } from '../services/architectureScorer.js';

const router = Router();

router.post('/score', authMiddleware, (req, res) => {
  const { architecture } = req.body;
  if (!architecture || !architecture.nodes) {
    res.status(400).json({ error: 'Architecture with nodes is required' });
    return;
  }
  const score = scoreArchitecture(architecture);
  res.json(score);
});

export { router as scoringRouter };

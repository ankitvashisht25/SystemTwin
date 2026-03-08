import { Router } from 'express';
import { authMiddleware } from '../services/auth.js';
import { estimateArchitectureCost } from '../services/costEstimator.js';

const router = Router();

router.post('/estimate', authMiddleware, (req, res) => {
  const { architecture } = req.body;
  if (!architecture || !architecture.nodes) {
    res.status(400).json({ error: 'Architecture with nodes is required' });
    return;
  }
  const cost = estimateArchitectureCost(architecture);
  res.json(cost);
});

export { router as costRouter };

import { Router } from 'express';
import { authMiddleware } from '../services/auth.js';
import { compareArchitectures } from '../services/architectureComparer.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const { left, right } = req.body;
  if (!left?.nodes || !right?.nodes) {
    res.status(400).json({ error: 'Both left and right architectures with nodes are required' });
    return;
  }
  try {
    const result = compareArchitectures(left, right);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Comparison failed' });
  }
});

export { router as compareRouter };

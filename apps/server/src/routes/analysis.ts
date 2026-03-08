import { Router } from 'express';
import { analyzeSimulation } from '../services/aiAnalysis.js';
import { authMiddleware } from '../services/auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  const { architecture, metrics, logs, failures } = req.body;
  const report = await analyzeSimulation(architecture, metrics, logs, failures);
  res.json(report);
});

export { router as analysisRouter };

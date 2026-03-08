import { Router } from 'express';
import { authMiddleware } from '../services/auth.js';
import { generateDocumentation } from '../services/docGenerator.js';

const router = Router();

router.post('/generate', authMiddleware, (req, res) => {
  const { architecture } = req.body;
  if (!architecture || !architecture.nodes) {
    res.status(400).json({ error: 'Architecture with nodes is required' });
    return;
  }
  const markdown = generateDocumentation(architecture);
  res.json({ format: 'markdown', content: markdown });
});

export { router as docsRouter };

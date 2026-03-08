import { Router } from 'express';
import { architectureTemplates } from '@systemtwin/shared';

const router = Router();

router.get('/', (_req, res) => {
  res.json(architectureTemplates.map(({ id, name, description, category, nodes, edges }) => ({
    id, name, description, category, nodeCount: nodes.length, edgeCount: edges.length,
  })));
});

router.get('/:id', (req, res) => {
  const template = architectureTemplates.find((t) => t.id === req.params.id);
  if (!template) {
    res.status(404).json({ error: 'Template not found' });
    return;
  }
  res.json(template);
});

export { router as templateRouter };

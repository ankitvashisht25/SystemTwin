import { Router } from 'express';
import { generateDockerCompose } from '../generators/dockerCompose.js';
import { generateKubernetes } from '../generators/kubernetes.js';
import { generateTerraform } from '../generators/terraform.js';

const router = Router();

router.post('/docker-compose', (req, res) => {
  const { architecture } = req.body;
  const output = generateDockerCompose(architecture);
  res.json({ format: 'docker-compose', output });
});

router.post('/kubernetes', (req, res) => {
  const { architecture } = req.body;
  const output = generateKubernetes(architecture);
  res.json({ format: 'kubernetes', output });
});

router.post('/terraform', (req, res) => {
  const { architecture } = req.body;
  const output = generateTerraform(architecture);
  res.json({ format: 'terraform', output });
});

export { router as generateRouter };

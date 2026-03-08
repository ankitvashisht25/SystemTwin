import { Router } from 'express';
import type { SimulationEngine } from '../services/simulationEngine.js';
import { validate } from '../middleware/validate.js';
import { startSimulationSchema, injectFailureSchema, removeFailureSchema } from '../schemas/simulation.js';

export function simulationRouter(engine: SimulationEngine) {
  const router = Router();

  router.post('/start', validate(startSimulationSchema), (req, res) => {
    const { architecture, config } = req.body;
    engine.start(architecture, config);
    res.json({ status: 'started' });
  });

  router.post('/stop', (_req, res) => {
    engine.stop();
    res.json({ status: 'stopped' });
  });

  router.post('/inject-failure', validate(injectFailureSchema), (req, res) => {
    const { nodeId, type } = req.body;
    engine.injectFailure(nodeId, type);
    res.json({ status: 'failure_injected' });
  });

  router.post('/remove-failure', validate(removeFailureSchema), (req, res) => {
    const { failureId } = req.body;
    engine.removeFailure(failureId);
    res.json({ status: 'failure_removed' });
  });

  router.get('/status', (_req, res) => {
    res.json(engine.getStatus());
  });

  return router;
}

import { Router } from 'express';
import { authMiddleware, type AuthRequest } from '../services/auth.js';
import { createVersion, getVersionHistory, getVersion, restoreVersion, diffVersions } from '../services/versioning.js';

const router = Router();
router.use(authMiddleware);

// GET /api/architecture/:id/versions
router.get('/:id/versions', (req: AuthRequest, res) => {
  try {
    const versions = getVersionHistory(String(req.params.id));
    res.json(versions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get version history' });
  }
});

// GET /api/architecture/:id/versions/:versionId
router.get('/:id/versions/:versionId', (req: AuthRequest, res) => {
  const version = getVersion(String(req.params.versionId));
  if (!version) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }
  res.json(version);
});

// POST /api/architecture/:id/versions/:versionId/restore
router.post('/:id/versions/:versionId/restore', (req: AuthRequest, res) => {
  try {
    const restored = restoreVersion(String(req.params.id), String(req.params.versionId), req.user!.userId);
    res.json(restored);
  } catch (error) {
    res.status(400).json({ error: 'Failed to restore version' });
  }
});

// GET /api/architecture/:id/versions/:v1/diff/:v2
router.get('/:id/versions/:v1/diff/:v2', (_req: AuthRequest, res) => {
  try {
    const diff = diffVersions(String(_req.params.v1), String(_req.params.v2));
    res.json(diff);
  } catch (error) {
    res.status(400).json({ error: 'Failed to diff versions' });
  }
});

export { router as versionsRouter };

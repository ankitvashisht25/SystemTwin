import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './lib/logger.js';
import { authRouter } from './routes/auth.js';
import { architectureRouter } from './routes/architecture.js';
import { simulationRouter } from './routes/simulation.js';
import { generateRouter } from './routes/generate.js';
import { analysisRouter } from './routes/analysis.js';
import { healthRouter } from './routes/health.js';
import { templateRouter } from './routes/templates.js';
import { versionsRouter } from './routes/versions.js';
import { teamsRouter } from './routes/teams.js';
import { permissionsRouter } from './routes/permissions.js';
import { costRouter } from './routes/cost.js';
import { recordingsRouter } from './routes/recordings.js';
import { notificationsRouter } from './routes/notifications.js';
import { marketplaceRouter } from './routes/marketplace.js';
import { apiKeysRouter } from './routes/apiKeys.js';
import { webhooksRouter } from './routes/webhooks.js';
import { embedsRouter } from './routes/embeds.js';
import { scoringRouter } from './routes/scoring.js';
import { docsRouter } from './routes/docs.js';
import { commentsRouter } from './routes/comments.js';
import { activityRouter } from './routes/activity.js';
import { infraImportRouter } from './routes/infraImport.js';
import { compareRouter } from './routes/compare.js';
import { SimulationEngine } from './services/simulationEngine.js';
import { authLimiter, apiLimiter, simulationLimiter } from './middleware/rateLimiter.js';

// Import database to ensure tables are created on startup
import './services/database.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(pinoHttp({ logger }));

const simulationEngine = new SimulationEngine(io);

app.use('/api', healthRouter);
app.use('/api/templates', templateRouter);
app.use('/api/auth', authLimiter, authRouter);
app.use('/api/architecture', apiLimiter, architectureRouter);
app.use('/api/simulation', simulationLimiter, simulationRouter(simulationEngine));
app.use('/api/generate', apiLimiter, generateRouter);
app.use('/api/analysis', apiLimiter, analysisRouter);
app.use('/api/architecture', versionsRouter);
app.use('/api/architecture', permissionsRouter);
app.use('/api/teams', apiLimiter, teamsRouter);
app.use('/api/cost', apiLimiter, costRouter);
app.use('/api/recordings', apiLimiter, recordingsRouter);
app.use('/api/notifications', apiLimiter, notificationsRouter);
app.use('/api/marketplace', apiLimiter, marketplaceRouter);
app.use('/api/api-keys', apiLimiter, apiKeysRouter);
app.use('/api/webhooks', apiLimiter, webhooksRouter);
app.use('/api/embeds', embedsRouter);
app.use('/api/scoring', apiLimiter, scoringRouter);
app.use('/api/docs', apiLimiter, docsRouter);
app.use('/api/comments', apiLimiter, commentsRouter);
app.use('/api/activity', apiLimiter, activityRouter);
app.use('/api/import', apiLimiter, infraImportRouter);
app.use('/api/compare', apiLimiter, compareRouter);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  // ─── Collaboration events ───
  let currentRoom: string | null = null;

  socket.on('collab:join', ({ architectureId, user }) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = `arch:${architectureId}`;
    socket.join(currentRoom);
    socket.to(currentRoom).emit('collab:user-joined', { socketId: socket.id, user });
    logger.info(`${user?.name || socket.id} joined room ${currentRoom}`);
  });

  socket.on('collab:leave', () => {
    if (currentRoom) {
      socket.to(currentRoom).emit('collab:user-left', { socketId: socket.id });
      socket.leave(currentRoom);
      currentRoom = null;
    }
  });

  socket.on('collab:cursor-move', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('collab:cursor-update', { socketId: socket.id, ...data });
    }
  });

  socket.on('collab:node-change', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('collab:node-changed', { socketId: socket.id, ...data });
    }
  });

  socket.on('collab:edge-change', (data) => {
    if (currentRoom) {
      socket.to(currentRoom).emit('collab:edge-changed', { socketId: socket.id, ...data });
    }
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      socket.to(currentRoom).emit('collab:user-left', { socketId: socket.id });
    }
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  logger.info(`SystemTwin server running on port ${PORT}`);
});

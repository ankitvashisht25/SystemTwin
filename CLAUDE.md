# SystemTwin

Visual system architecture designer with real-time simulation, chaos engineering, and infrastructure code generation.

## Project Structure

Turborepo monorepo with npm workspaces:

```
apps/server     - Express + Socket.io backend (port 3001)
apps/web        - React + Vite frontend (port 5173)
packages/shared - Shared TypeScript types, Zod schemas, and constants
```

## Tech Stack

- **Server**: Express 4.21, Socket.io 4.8, better-sqlite3, JWT auth, pino logging, Anthropic SDK, tsx (dev)
- **Web**: React 18.3, Vite 6, React Flow 12.4, Zustand 5, Tailwind CSS 3.4, Recharts, Monaco Editor, Framer Motion, html-to-image
- **Shared**: TypeScript types + Zod schemas
- **Tooling**: ESLint (flat config), Prettier, Vitest
- **Monorepo**: Turborepo 2.3, npm workspaces
- **Language**: TypeScript 5.7, strict mode, ES2022 target, ESNext modules

## Commands

```bash
npm run dev          # Start both server and web in parallel (Turbo)
npm run build        # Build all packages (shared -> apps)
npm run lint         # Type-check all packages (tsc --noEmit)
npm run lint:eslint  # ESLint across entire repo
npm run format       # Prettier format all files
npm run format:check # Check formatting
npm run test         # Run all Vitest tests (Turbo)
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT signing secret (has dev default, must change in prod)
- `ANTHROPIC_API_KEY` - For real AI analysis (falls back to mock if unset)
- `LOG_LEVEL` - Pino log level (default: info)

## API Routes

### Health (`/api`)
- `GET /health` - Liveness check
- `GET /ready` - Readiness check (DB connectivity)

### Auth (`/api/auth`) - rate limited (10/15min)
- `POST /register` - User registration (Zod validated)
- `POST /login` - User login
- `GET /me` - Current user profile (auth required)
- `PUT /me` - Update profile (auth required)
- `PUT /me/password` - Change password (auth required)

### Architecture (`/api/architecture`) - auth required, rate limited
- `GET /` - List user's architectures
- `GET /:id` - Get architecture by ID
- `POST /` - Create new architecture
- `PUT /:id` - Update architecture (auto-snapshots version before update)
- `DELETE /:id` - Delete architecture

### Architecture Versioning (`/api/architecture/:id/versions`) - auth required
- `GET /` - List version history
- `GET /:versionId` - Get specific version
- `POST /:versionId/restore` - Restore version (creates snapshot first)
- `GET /:v1/diff/:v2` - Diff two versions

### Architecture Permissions (`/api/architecture/:id/permissions`) - auth required
- `GET /` - List permissions
- `POST /` - Grant permission (owner only)
- `DELETE /:permId` - Revoke permission (owner only)
- `GET /shared/with-me` - List architectures shared with current user

### Teams (`/api/teams`) - auth required, rate limited
- `POST /` - Create team
- `GET /` - List user's teams
- `GET /:id` - Get team details + members
- `PUT /:id` - Update team (owner only)
- `DELETE /:id` - Delete team (owner only)
- `POST /:id/members` - Add member by email (admin+)
- `DELETE /:id/members/:userId` - Remove member (admin+)
- `PUT /:id/members/:userId` - Update member role (admin+)

### Templates (`/api/templates`)
- `GET /` - List architecture templates (summaries)
- `GET /:id` - Get full template (nodes + edges)

### Simulation (`/api/simulation`) - rate limited (20/min)
- `POST /start` - Start simulation (Zod validated)
- `POST /stop` - Stop simulation
- `POST /inject-failure` - Inject failure (Zod validated)
- `POST /remove-failure` - Remove failure (Zod validated)
- `GET /status` - Get simulation status

### Recordings (`/api/recordings`) - auth required
- `POST /` - Save simulation recording
- `GET /` - List recordings
- `GET /:id` - Get recording with full tick data
- `DELETE /:id` - Delete recording

### Generate (`/api/generate`) - rate limited
- `POST /docker-compose` - Generate Docker Compose
- `POST /kubernetes` - Generate Kubernetes manifests
- `POST /terraform` - Generate Terraform config

### Cost (`/api/cost`) - auth required
- `POST /estimate` - Estimate AWS cost for architecture

### Analysis (`/api/analysis`) - auth required
- `POST /` - Generate AI analysis report (Claude API or mock fallback)

## Socket.io Events

Server emits:
- `simulation:tick` - Real-time tick data
- `simulation:log` - Individual log entry
- `simulation:failure-injected` / `simulation:failure-removed` - Failure lifecycle
- `simulation:stopped` - Simulation completed
- `simulation:sla-violation` - SLA threshold breached

## Database

SQLite via better-sqlite3 at `data/systemtwin.db` (WAL mode, foreign keys enabled).

**Tables:** `users`, `architectures`, `architecture_versions`, `teams`, `team_members`, `architecture_permissions`, `simulation_recordings`

## Server (`apps/server/src/`)

- `index.ts` - Express + Socket.io setup, middleware chain, route mounting
- `lib/logger.ts` - Pino logger (pino-pretty in dev)
- `middleware/` - validate (Zod), rateLimiter, authorize (RBAC)
- `routes/` - auth, architecture, versions, permissions, teams, simulation, templates, generate, analysis, health, cost, recordings
- `services/` - auth, database, simulationEngine, aiAnalysis (Claude API), versioning, teams, permissions, costEstimator, chaosScheduler, slaMonitor
- `generators/` - Kubernetes, Docker Compose, Terraform

## Web (`apps/web/src/`)

- `stores/` - auth, architecture, simulation, UI, project, connection
- `lib/` - api.ts (HTTP client), socket.ts (Socket.io with reconnection + polling fallback)
- `hooks/` - useSimulation (socket lifecycle + connection status tracking)
- `components/canvas/` - React Flow editor (BaseNode, AnimatedEdge)
- `components/topbar/` - TopBar, ExportModal (Docker/K8s/TF/JSON/SVG/PNG)
- `components/sidebar/` - ComponentLibrary (drag-and-drop)
- `components/config-panel/` - Node configuration forms
- `components/observability/` - MetricsCharts, LogViewer, AlertBar
- `components/simulation/` - ChaosPanel, AnalysisReport, SimulationBar
- `components/templates/` - TemplateSelector (4 pre-built architectures)
- `components/import/` - ImportModal (JSON file import with validation)
- `components/ui/` - ConnectionStatus indicator
- `components/auth/` - AuthPage, UserMenu, SavedArchitectures

## Shared (`packages/shared/src/`)

- `types/` - architecture, simulation, components, templates, versioning, teams, chaos, sla, recording, cost
- `schemas/` - Zod validation schemas for auth, architecture, simulation
- `constants/` - componentLibrary (20 components), architectureTemplates (4 templates), chaosScenarios (4 scenarios)

## Key Patterns

- **Logging**: Pino structured logging with pino-http middleware (request ID tracking)
- **Validation**: Zod schemas in shared package, `validate(schema)` Express middleware
- **Rate limiting**: express-rate-limit (auth: 10/15min, API: 100/min, simulation: 20/min)
- **Versioning**: Auto-snapshot on architecture save, restore with auto-snapshot, version diffing
- **RBAC**: owner/editor/viewer permissions on architectures, owner/admin/member roles on teams
- **AI Analysis**: Claude API with structured JSON output, mock fallback when no API key
- **WebSocket**: Reconnection with 10 attempts, polling fallback, connection status store
- **Cost estimation**: AWS pricing approximations, per-node breakdown, scaling projections (2x/5x/10x)
- **Chaos scenarios**: Pre-defined multi-step failure scenarios with tick-based scheduling

## Conventions

- TypeScript strict mode, `.js` extensions in ESM imports
- Express v5 types: `req.params.*` is `string | string[]`, wrap with `String()`
- Vite proxies `/api` and `/socket.io` to server in dev
- Error responses: `res.status(code).json({ error: 'message' })`
- Zustand stores: sessionStorage for UI/architecture/project, localStorage for auth token
- ESLint flat config + Prettier (single quotes, trailing comma es5, 120 print width)
- Vitest for testing (workspace config, node env for server, jsdom for web)

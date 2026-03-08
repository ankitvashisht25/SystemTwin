# SystemTwin

**Visual system architecture designer with real-time simulation, chaos engineering, and infrastructure code generation.**

Design cloud architectures by dragging components onto a canvas, connect them, simulate traffic, inject failures, and export production-ready infrastructure configs — all in the browser.

## Features

- **Drag-and-Drop Canvas** — 65+ components across 9 categories (Frontend, Backend, Database, Cache, Queue, Infrastructure, AWS, Azure, GCP)
- **Real-Time Simulation** — Tick-based engine with traffic patterns (steady, ramp, spike, wave), customizable from 10 to 50K virtual users
- **Chaos Engineering** — Inject crashes, latency, network partitions, resource exhaustion. Pre-built scenarios: Region Outage, Cascade Test, Load Spike
- **Live Metrics on Nodes** — CPU/Memory bars, latency, throughput, error rate displayed directly on each node during simulation
- **Traffic-Aware Edges** — Edge color, width, and particle speed change based on real-time traffic data
- **Infrastructure Code Generation** — Export to Docker Compose, Kubernetes, Terraform, JSON, SVG, PNG
- **AI-Powered Analysis** — Claude API integration for post-simulation root cause analysis and recommendations
- **Architecture Scoring** — Grades (A+ to F) across resilience, cost efficiency, scalability, security, complexity
- **Cost Estimation** — AWS pricing estimates with per-node breakdown and scaling projections
- **13 Architecture Templates** — Microservices, CQRS, E-Commerce, Data Pipeline, Multi-Region HA, SaaS, IoT, BFF, Saga, and more
- **Cloud Import** — Simulated AWS/GCP/Azure infrastructure discovery across 20 service categories
- **Real-Time Collaboration** — Figma-style multiplayer cursors via Socket.io
- **Architecture Versioning** — Auto-snapshot on save, version history, restore, diff
- **Teams & RBAC** — Teams, invites, owner/editor/viewer permissions
- **Marketplace** — Publish, browse, rate community architecture templates
- **Dark/Light Theme** — Toggle with persistent preference

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Flow, Zustand, Tailwind CSS, Recharts, Framer Motion |
| **Backend** | Express, Socket.io, better-sqlite3, Pino, Zod |
| **Shared** | TypeScript types, Zod schemas, component library |
| **AI** | Anthropic Claude API (optional, falls back to mock) |
| **Tooling** | Turborepo, ESLint, Prettier, Vitest |

## Quick Start

```bash
git clone <repo-url>
cd SystemTwin
npm install
npm run dev
```

Server runs on `http://localhost:3001`, web on `http://localhost:5173`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes (prod) | JWT signing secret — change from default |
| `ANTHROPIC_API_KEY` | No | Enables real AI analysis (falls back to mock) |
| `PORT` | No | Server port (default: 3001) |

## Scripts

```bash
npm run dev          # Start dev (server + web)
npm run build        # Build all packages
npm run test         # Run all tests
npm run lint         # Type-check
npm run lint:eslint  # ESLint
npm run format       # Prettier
```

## API Overview

| Area | Endpoints |
|------|-----------|
| Auth | Register, login, profile, password |
| Architecture | CRUD, versioning, permissions, comparison |
| Simulation | Start/stop, inject/remove failures, chaos scenarios, SLA monitoring |
| Templates | 13 built-in + marketplace browse/publish/rate |
| Generate | Docker Compose, Kubernetes, Terraform |
| Analysis | AI-powered simulation analysis |
| Scoring | Architecture resilience/cost/security grading |
| Docs | Auto-generate Markdown documentation |
| Cost | AWS cost estimation with projections |
| Cloud Import | Simulated AWS/GCP/Azure discovery (20 categories) |
| Teams | Create, invite, manage roles |
| Comments | Thread comments on architectures/nodes |
| Activity | Audit log of all actions |
| Notifications | In-app notification center |
| API Keys | Generate/revoke API keys |
| Webhooks | Subscribe to architecture events |
| Embeds | Embeddable architecture diagrams |
| Recordings | Save/replay simulation runs |

## License

MIT

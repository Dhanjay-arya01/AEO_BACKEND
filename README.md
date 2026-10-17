# SiteUp Main Backend

High-performance, modular Node.js REST API backend for **SiteUp** — an SEO and Answer Engine Optimization (AEO) audit platform.

Built with **Node.js (ES Modules)**, **Express.js**, **MongoDB (Mongoose)**, and **RabbitMQ (`amqplib`)**.

---

## 1. Architecture & Design Principles

- **Separation of Concerns**: Clean layered architecture dividing responsibilities across Config, Models, Repositories, Services, Controllers, Routes, and Middleware.
- **SSRF Defense**: Strict URL parsing and DNS pre-resolution checking against private IPv4 (RFC 1918, loopback, cloud metadata `169.254.169.254`) and IPv6 spaces before saving or auditing website targets.
- **Asynchronous Event-Driven Pipeline**: When an audit is requested, the backend persists the audit in a `QUEUED` state, publishes a versioned job message to RabbitMQ (`audit.jobs` durable queue, persistent delivery), and returns immediate acknowledgment to the client.
- **Zero AI / Worker Coupling**: The main backend handles persistence, authentication, authorization, project management, queue publishing, and API querying. All heavy crawling, LLM analysis, RAG indexing, and content generation remain reserved for the Python worker.
- **Resilient Connections & Graceful Degradation**: Both MongoDB and RabbitMQ connections handle disconnects, timeouts, and automatic background reconnection without crashing the server.

---

## 2. Project Directory Structure

```text
AEO_BACKEND/
├── .env.example              # Documented configuration template
├── .gitignore                # Git exclusions
├── package.json              # Project dependencies and npm scripts
├── index.js                  # Entry point delegating to src/server.js
├── src/
│   ├── config/
│   │   ├── env.js            # Environment variable validation & exports
│   │   ├── database.js       # Mongoose connection & lifecycle handlers
│   │   └── rabbitmq.js       # AMQP client, durable queue assertion, reconnection
│   ├── models/
│   │   ├── User.js           # User schema (roles, bcrypt hash hidden, email index)
│   │   ├── Project.js        # Website project schema (SSRF domain, type, keywords)
│   │   └── Audit.js          # Audit lifecycle (11 stages, progress, results blob)
│   ├── repositories/
│   │   ├── user.repository.js    # Data access layer for users
│   │   ├── project.repository.js # Data access layer for projects
│   │   └── audit.repository.js   # Data access layer for audits & aggregations
│   ├── services/
│   │   ├── auth.service.js       # Signup, login, JWT token issuance
│   │   ├── user.service.js       # Profiles and self-deactivation
│   │   ├── project.service.js    # Project CRUD with SSRF validation
│   │   ├── audit.service.js      # Audit scheduling, retry, cancel, result querying
│   │   ├── admin.service.js      # Admin dashboard stats, user/audit controls
│   │   └── dashboard.service.js  # User-specific metrics and recent activity
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── project.controller.js
│   │   ├── audit.controller.js
│   │   ├── admin.controller.js
│   │   ├── dashboard.controller.js
│   │   └── health.controller.js
│   ├── routes/
│   │   ├── index.js          # Mounts all sub-routers under /api
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── project.routes.js
│   │   ├── audit.routes.js
│   │   ├── admin.routes.js
│   │   ├── dashboard.routes.js
│   │   └── health.routes.js
│   ├── middleware/
│   │   ├── auth.middleware.js     # Bearer JWT verification & active account check
│   │   ├── role.middleware.js     # Role verification (ADMIN vs USER)
│   │   ├── validate.middleware.js # Request payload validation runner
│   │   ├── error.middleware.js    # Centralized JSON error formatting
│   │   └── notFound.middleware.js # Standardized 404 handler
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   ├── project.validator.js
│   │   └── audit.validator.js
│   ├── utils/
│   │   ├── apiError.util.js   # Operational error class with status codes
│   │   ├── response.util.js   # Consistent success/error response helpers
│   │   ├── pagination.util.js # Pagination calculation & metadata
│   │   └── ssrf.util.js       # Strict URL & DNS resolution validation
│   ├── queues/
│   │   └── audit.publisher.js # RabbitMQ persistent job publisher
│   ├── app.js                 # Express application initialization & middleware
│   └── server.js              # Server boot, DB/RabbitMQ initialization, graceful exit
└── tests/
    ├── ssrf.test.js           # Unit tests for SSRF protections
    └── auth_utils.test.js     # Unit tests for JWT, validation, and pagination
```

---

## 3. Environment Variables

Create `.env` using `.env.example` as a template:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port for Express server |
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`) |
| `CORS_ORIGIN` | `*` or `http://localhost:3000` | Allowed CORS origins (supports comma-separated list) |
| `MONGO_URI` | `mongodb://localhost:27017/siteup` | MongoDB connection URI |
| `JWT_SECRET` | *(Random 32+ char secret)* | Secret key for JWT signing |
| `JWT_EXPIRES_IN`| `7d` | JWT token validity window |
| `RABBITMQ_URL` | `amqp://localhost:5672` | RabbitMQ connection URL |
| `RABBITMQ_AUDIT_QUEUE` | `audit.jobs` | Durable queue for audit jobs |

---

## 4. API Routes Overview

Base URL: `http://localhost:5000/api`

### Health & Monitoring
- `GET /api/health` — Public health check (API status, MongoDB connection, RabbitMQ connection, queue stats, memory)
- `GET /` — API root information

### Authentication (`/api/auth`)
- `POST /signup` — Register a new account (`name`, `email`, `password`, `company`)
- `POST /login` — Authenticate and receive JWT token (`email`, `password`)
- `POST /logout` — Logout (client drops token)
- `GET /me` — Retrieve current authenticated user (`Bearer <token>`)

### User Profile (`/api/users`)
- `GET /profile` — Get profile of current user
- `PATCH /profile` — Update name, avatarUrl, company
- `POST /deactivate` — Deactivate own account

### Dashboard (`/api/dashboard`)
- `GET /summary` — User dashboard summary (total/active projects, running/completed audits, average SEO/AEO scores, recent history)

### Projects (`/api/projects`)
- `POST /` — Create project (`name`, `websiteUrl`, `websiteType`, `targetAudience`, `targetLocation`, `keywords`, `competitors`)
  - *Performs SSRF validation and extracts canonical domain.*
- `GET /` — List user's projects with pagination (`?page=1&limit=10&search=...`)
- `GET /:id` — Get single project details
- `PATCH /:id` — Update project metadata
- `DELETE /:id` — Delete project (cascades delete to associated audits)

### Audits (`/api/audits`)
- `POST /` or `POST /api/projects/:projectId/audits` — Create and trigger an audit. Returns audit ID immediately and publishes job to RabbitMQ.
- `GET /` or `GET /api/projects/:projectId/audits` — List audits for a project
- `GET /:id` — Get full audit details
- `GET /:id/progress` — Polling-friendly lightweight progress endpoint (`status`, `currentStage`, `progress`, `seoScore`, `aeoScore`)
- `GET /:id/results` — Get completed audit results (issues, AEO analysis, recommendations, pages, technical overview)
- `POST /:id/retry` — Re-queue a `FAILED` or `CANCELLED` audit with a new `jobId`
- `POST /:id/cancel` — Cancel an in-progress or queued audit

### Admin Operations (`/api/admin`) *(Requires `role: ADMIN`)*
- `GET /dashboard` or `/stats` — Platform-wide statistics (users, projects, audits breakdown, average scores, queue status)
- `GET /users` — Paginated user listing with filters (`?role=...&isActive=...&search=...`)
- `GET /users/:id` — Deep user details (associated projects, audit count, recent projects)
- `PATCH /users/:id/status` — Activate or deactivate user account
- `GET /projects` — View all projects across all users
- `GET /audits` — View all audits across all users
- `GET /audits/:id/failure` — Detailed diagnosis of failed audit (error stack, failure stage, project details)
- `GET /queues` — RabbitMQ queue status (message count, consumer count)

---

## 5. Audit Lifecycle & RabbitMQ Flow

### Supported Audit Statuses
`QUEUED` → `CRAWLING` → `SEO_ANALYSIS` → `AEO_ANALYSIS` → `RESEARCHING` → `INDEXING` → `GENERATING` → `VALIDATING` → `COMPLETED`  
*(Error states: `FAILED`, `CANCELLED`)*

### RabbitMQ Job Publishing Specification
When an audit is initiated:
1. Audit is persisted in MongoDB with `status: 'QUEUED'`, `progress: 0`, and a unique `jobId: 'job_<uuid>'`.
2. A persistent message is published to the durable `audit.jobs` queue with the following structure:
```json
{
  "version": "1.0",
  "jobId": "job_e9b28a41-2b02-4d04-8b63-8a355f3dd90f",
  "auditId": "653a1f9a2b5e8c001f3e7b1a",
  "projectId": "653a1f872b5e8c001f3e7b12",
  "ownerId": "653a1f732b5e8c001f3e7b08",
  "jobType": "FULL_AUDIT",
  "createdAt": "2026-10-17T03:45:00.000Z",
  "payload": {
    "websiteUrl": "https://example.com",
    "domain": "example.com",
    "websiteType": "SaaS",
    "targetAudience": "B2B SaaS Founders",
    "targetLocation": "Global",
    "keywords": ["ai search optimization", "aeo audit"],
    "competitors": ["competitor.com"]
  }
}
```
3. If RabbitMQ is unavailable during publishing, the audit is updated to `FAILED` with an explicit reason (`QUEUE_PUBLISH_FAILED`) and returns HTTP 503 so jobs are never silently orphaned.

---

## 6. Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 20+)
- MongoDB instance (local or Atlas)
- RabbitMQ broker (local or CloudAMQP)

### Installation
```bash
cd AEO_BACKEND
npm install
```

### Running Locally
```bash
# Start in development mode with nodemon auto-restart:
npm run dev

# Start in production mode:
npm start

# Run automated tests:
npm test
```

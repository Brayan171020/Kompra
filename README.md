# Kompra

[![CI](https://github.com/Brayan171020/Kompra/actions/workflows/ci.yml/badge.svg)](https://github.com/Brayan171020/Kompra/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Neon PostgreSQL](https://img.shields.io/badge/Neon-PostgreSQL-00E599?logo=postgresql&logoColor=111111)](https://neon.tech/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-FE0803?logo=typeorm&logoColor=white)](https://typeorm.io/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-session%20security-111827)](https://www.better-auth.com/)

## Project Overview

Kompra is a collaborative grocery-list and household-inventory platform. It
replaces paper notes and fragmented messages with shared lists, clear ownership,
fast supermarket workflows, and a chronological pantry record for the home.

## Architecture & Monorepo Structure

```text
Kompra/
├── apps/
│   ├── api/                         # NestJS REST API, TypeORM, Swagger
│   │   └── src/
│   │       ├── entities/            # Domain persistence models
│   │       ├── health/              # DB-aware health endpoint
│   │       ├── categories/          # Default category seed
│   │       └── common/              # Cross-cutting filters and infrastructure
│   └── web/                         # Next.js App Router, Tailwind, Lucide
│       └── app/                     # Mobile-first product surfaces
├── docs/PLAN.md                     # Official phased engineering roadmap
├── pnpm-workspace.yaml
└── package.json                     # Workspace orchestration
```

```text
Next.js Web ── REST /api/v1 ──> NestJS API ── TypeORM ──> Neon PostgreSQL
      │                              │                         │
 Better Auth client ───────────────> Better Auth ────────> neon_auth schema
```

## Tech Stack

| Area | Technology | Responsibility |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript | Product UI and server/client rendering |
| Styling | Tailwind CSS, Lucide React | Responsive visual system and icons |
| Backend | NestJS 11, TypeScript strict | Versioned REST API and application modules |
| Persistence | TypeORM, PostgreSQL on Neon | Domain entities, repositories, transactions |
| Authentication | Better Auth | Sessions, identity, cookies, and role mapping |
| API contract | Swagger / OpenAPI | Discoverable and reviewable API surface |
| Delivery | pnpm workspaces, GitHub Actions | Reproducible builds and CI quality gates |

## Local Development Guide

Requirements: Node.js 20 LTS or newer, pnpm 9+, and a development PostgreSQL
connection. Copy the documented environment examples and keep real credentials
local; never commit `.env` files.

```bash
pnpm install
pnpm run dev       # API on :4000 and web on the Next.js dev port
pnpm run lint
pnpm test          # populated as Jest suites land in the roadmap
pnpm --filter api run test:e2e
pnpm run build
```

The complete automated test commands are:

```bash
pnpm test
pnpm --filter api run test:e2e
```

### Authentication providers

The API supports Better Auth email/password, Magic Link and optional Google OAuth.
Configure the following variables in the deployment environment when enabling the
corresponding provider:

```text
BETTER_AUTH_SECRET=<at least 32 characters>
BETTER_AUTH_URL=https://api.example.com
TRUSTED_ORIGINS=https://app.example.com
GOOGLE_CLIENT_ID=<google oauth client id>
GOOGLE_CLIENT_SECRET=<google oauth client secret>
MAGIC_LINK_WEBHOOK_URL=<trusted email delivery webhook>
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-fancy-star-b5njfgl0.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth
```

`MAGIC_LINK_WEBHOOK_URL` receives `{ email, url }` as JSON. In local development,
when it is absent, Better Auth logs the generated link instead of attempting an
external delivery. Production startup/requests require a configured delivery
endpoint.

The production Neon branch contains the managed `neon_auth` schema and its
`user`, `session`, `account` and `project_config` tables. Kompra exposes
email/password and Magic Link through the NestJS `/api/v1/auth` proxy. When
`NEXT_PUBLIC_NEON_AUTH_URL` is configured, Google OAuth is sent directly to the
managed Neon Auth endpoint because Neon owns the Shared Keys. The local Google
provider is registered only when both server-side `GOOGLE_CLIENT_ID` and
`GOOGLE_CLIENT_SECRET` are present, preventing
`CLIENT_ID_AND_SECRET_REQUIRED` when Google is managed by Neon.

For the API, configure `apps/api/.env` from `apps/api/.env.example`. Better Auth
will additionally require `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` when Phase
1 is implemented.

## API Documentation & Swagger

The API uses a global `/api` prefix and URI versioning. Versioned resources are
available under `/api/v1/*`; interactive OpenAPI documentation is available at
`/api/docs` while the API is running.

The initial health check is:

```bash
curl http://localhost:4000/api/v1/health
```

## Neon MCP

The Neon MCP server is configured globally in OpenCode, outside this repository,
and is project-scoped to Kompra. Authentication uses the local
`NEON_API_KEY` environment variable through `{env:NEON_API_KEY}`. The production
branch must be selected explicitly before schema or query operations. No Neon
API key is stored in this repository.

## Roadmap

Read the official implementation plan in [`docs/PLAN.md`](docs/PLAN.md). It
covers Better Auth and RBAC, the mobile supermarket engine, pantry history, and
the complete Jest/Supertest/GitHub Actions quality pipeline.

## Author & Portfolio

Built by **[Brayan Gamboa](https://github.com/Brayan171020)**.

- GitHub: https://github.com/Brayan171020
- Portfolio: https://brayan-portafolio-topaz.vercel.app

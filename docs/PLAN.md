# Kompra Engineering Roadmap

This document is the delivery plan for Kompra, a collaborative grocery-list and
household-inventory platform. Work is delivered in vertical slices; each phase
must preserve API versioning, strict TypeScript, mobile-first UX, and the
security boundaries documented below.

## Architecture guardrails

- **Monorepo:** pnpm workspace with `apps/api` (NestJS) and `apps/web` (Next.js).
- **API contract:** global `/api` prefix and URI versioning under `/api/v1`.
- **Persistence:** Neon PostgreSQL. Better Auth owns the `neon_auth` schema;
  Kompra domain entities remain isolated in the application schema and refer to
  authenticated identities through stable IDs, never by duplicating passwords.
- **ORM:** TypeORM repositories, explicit transactions for multi-write flows,
  migrations for production, and `synchronize` disabled outside local bootstrap.
- **Security:** secrets are environment-managed only. The Neon MCP configuration
  is global to OpenCode and uses `{env:NEON_API_KEY}`; no API key belongs in this
  repository.
- **Quality:** validation pipes, centralized exception responses, typed DTOs,
  unit/integration/E2E tests, and visual responsive checks are release gates.

## Phase 1 — Data foundation, Better Auth, and RBAC

### Objective

Establish users and sessions in Neon through Better Auth, with typed `CREATOR`
and `BUYER` roles and a secure NestJS authorization boundary.

### Technical deliverables

1. Configure Better Auth server-side in `apps/api` using the Neon PostgreSQL
   adapter and `neon_auth` isolation. Enable email/password registration,
   secure cookies, trusted origins, session expiry, and production secrets.
2. Configure the typed Better Auth client in `apps/web` with
   `createAuthClient`, session hooks, sign-in, sign-up, and sign-out flows.
3. Add NestJS auth infrastructure: `AuthModule`, auth service, request session
   middleware/guard, `@Roles('CREATOR', 'BUYER')`, `@CurrentUser()`, and support
   for cookie and Bearer-token sessions.
4. Add versioned endpoints: `/api/v1/auth/*` and `/api/v1/users/me`.
5. Keep domain `UserEntity` aligned with the Better Auth identity model without
   storing a second password hash; add role mapping and indexes through a
   migration.

### Definition of Done

- Registration, login, logout, session refresh, and `/users/me` work through the
  web client and REST API.
- Unauthenticated requests receive `401`; authenticated users with insufficient
  roles receive `403`.
- Unit tests cover guards, decorators, role mapping, and session failures.
- Integration tests cover the Better Auth adapter against an isolated Neon
  branch or disposable Postgres database.
- No credentials, session tokens, or auth headers appear in logs or fixtures.

## Phase 2 — Grocery-list engine and supermarket mode

### Objective

Deliver fast, reliable mobile workflows for creating, assigning, and completing
shopping lists.

### Technical deliverables

1. Build REST resources `/api/v1/lists` and `/api/v1/items` with DTOs,
   ownership/assignment authorization, pagination, and TypeORM repositories.
2. Use atomic transactions for list creation, assignment, item updates, and
   completion; protect concurrent updates with appropriate locking/versioning.
3. Model `PENDING`, `PARTIALLY_COMPLETED`, and `COMPLETED`. Partial completion
   supports a purchased quantity plus an optional or required reason note based
   on the final product rule.
4. Support `UNIT` and `WEIGHT`, with explicit kg/g normalization and strict
   positive decimal validation.
5. In `apps/web`, create the Impeccable mobile-first supermarket surface:
   category color grouping, large touch targets, optimistic progress updates,
   tactile feedback, and an “Ocultar completados” toggle.
6. Add a realtime strategy (SSE or WebSocket) for assigned-list progress, with
   REST polling fallback and conflict reconciliation.

### Definition of Done

- A creator assigns a list to a buyer; the buyer can update item progress from
  a mobile viewport and refresh without losing data.
- Every state transition is validated server-side and persisted transactionally.
- Unauthorized list/item access is denied, including guessed IDs.
- API integration tests cover concurrent updates, partial quantities, units,
  categories, and empty/invalid payloads.
- Responsive UI checks pass at 360px, 390px, 428px, tablet, and desktop widths.

## Phase 3 — Pantry mode and historical purchases

**Status: Complete — 2026-09-22**

Delivered: indexed inventory persistence with cost/source references, paginated
history and current-month analytics, transactional idempotent imports from
finished lists, and the mobile-first `/app/inventory` pantry surface.

### Objective

Create a chronological purchase record and useful household consumption signals.

### Technical deliverables

1. Harden `InventoryPurchaseEntity` and expose `/api/v1/inventory` with strict
   DTO validation, date-range filters, category filters, pagination, and stable
   sorting.
2. Archive finished lists and transfer purchased items to inventory in one
   idempotent transaction. Preserve source list/item references for auditability.
3. Add duplicate-protection/idempotency keys for imports and a clear partial
   failure strategy.
4. Build web dashboard and history surfaces with monthly summary cards and
   category breakdown visualizations; include loading, empty, error, and no-data
   states.

### Definition of Done

- Manual inventory creation and list import both validate input strictly.
- Repeating an import does not duplicate purchases.
- Date boundaries, timezone handling, category filters, and archived-list
  permissions are covered by unit and integration tests.
- Dashboard values reconcile with API aggregates and remain usable on mobile.

## Phase 4 — Quality, automated testing, and CI/CD

### Objective

Make every push and pull request reproducible, observable, and release-safe.

### Technical deliverables

1. Add Jest unit tests in `apps/api` and `apps/web`; use repository/service
   mocks for fast tests and real database integration tests for persistence.
2. Add Supertest E2E coverage for health, auth, RBAC, list assignment, item
   transitions, and inventory import.
3. Add `.github/workflows/ci.yml` for Node 20 LTS and pnpm 9. The pipeline must
   run install with the lockfile, typecheck, lint, unit tests, E2E tests, and
   production builds for both workspaces.
4. Use GitHub Actions secrets/environment protection for Neon; never commit
   `.env`, Better Auth secrets, or Neon API keys. Prefer an isolated branch or
   ephemeral database in CI.
5. Add coverage thresholds, artifact upload for failed tests, and a CI badge to
   `README.md`.

### Definition of Done

- GitHub Actions is green on push and pull request with no dependency drift.
- Critical API flows have deterministic Supertest coverage.
- Unit, integration, E2E, typecheck, lint, and build commands are documented and
  repeatable locally.
- Secret scanning reports no exposed credentials.
- Release regression suite passes: all P0 tests, at least 90% of P1 tests, and no
  open critical/high-severity defects.

## QA strategy and release gates

| Suite | Scope | Gate |
| --- | --- | --- |
| Smoke | install, health, web render, API build | Every PR |
| Auth/RBAC | registration, login, session, role denial | Every auth change |
| Domain integration | lists, quantities, inventory transactions | Every domain change |
| E2E | creator-to-buyer critical journey | Every PR after Phase 4 |
| Responsive UX | 360–1440px, touch targets, loading/error states | Every web surface |
| Security | validation, IDOR, secrets, rate limits | Release candidate |

## Operational checklist

- Run `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm test`, and `pnpm build`.
- Verify Neon MCP is configured outside the repository and scoped to project
  `nameless-shape-61810778`; select the `production` branch explicitly before
  any query or schema operation.
- Review all schema changes and execute migrations through a controlled CI/CD
  environment; do not rely on `synchronize` in production.

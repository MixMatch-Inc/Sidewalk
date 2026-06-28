# Contributor Guide

## Project Structure

```text
sidewalk/
├── apps/
│   ├── api/       # Express modular monolith (auth API)
│   ├── web/       # Next.js authentication UI
│   └── mobile/    # Expo / React Native foundation
├── packages/
│   ├── shared/    # Shared types and validation schemas
│   └── stellar/   # Stellar integration scaffold (no blockchain logic yet)
├── docs/          # Environment, testing, and contributor documentation
└── .github/workflows/  # CI pipelines, one per package
```

### Backend modules (`apps/api/src/modules`)

The API is a **modular monolith** organized by business domain, not by
technical layer. Each module owns its controllers, services, validators,
routes, types, and tests:

```text
modules/
  auth/        # registration, login, token issuance
  users/       # user lookups used to support authentication
  reports/     # civic report submission, listing, and moderation
shared/        # cross-cutting config, database, middleware, errors, logger
```

New backend functionality should be added as a new module under
`src/modules/`, following the same internal structure. Avoid putting business
logic in `shared/` — it is for cross-cutting infrastructure only.

---

## Repo Bootstrap Path

If you are starting from the auth starter (the current state of this repo),
follow these steps to get a working local environment from scratch.

### 1. Prerequisites

- Node.js 20+
- pnpm 10+

### 2. Clone and install

```bash
git clone https://github.com/MixMatch-Inc/Sidewalk.git
cd Sidewalk
pnpm install
```

### 3. Configure environment variables

Each app ships an `.env.example`. Copy the relevant one(s) before running:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

See [docs/environment.md](environment.md) for a description of every variable.

### 4. Set up the API database

The API uses Prisma with a local SQLite file by default. Generate the Prisma
client and push the schema on first run:

```bash
pnpm --filter @sidewalk/api exec prisma generate
pnpm --filter @sidewalk/api exec prisma db push
```

### 5. Start the apps

```bash
pnpm dev:api      # http://localhost:4000
pnpm dev:web      # http://localhost:3000
pnpm dev:mobile   # Expo dev server
```

Once both are running, visit `http://localhost:3000` to create an account and
log in.

### 6. Verify the setup

```bash
pnpm check   # runs lint + typecheck + test + build across all packages
```

All checks should pass on a fresh clone before you make any changes.

---

## Adding a New Module

New product domains (e.g. `reports`, `identity`, `notifications`) live as
sibling modules next to `auth` under `apps/api/src/modules/`. Follow the
pattern established by the existing modules so that new code integrates
without requiring changes to the core `shared/` infrastructure.

### 1. Create the module directory

```bash
mkdir -p apps/api/src/modules/<name>/{controllers,services,routes,validators,types,tests}
```

Replace `<name>` with the domain name in kebab-case (e.g. `reports`).

### 2. Lay down the standard files

Each module must contain at minimum:

| File | Purpose |
| ---- | ------- |
| `routes/<name>.routes.ts` | Express router — mounts controllers onto URL paths |
| `controllers/<name>.controller.ts` | Request/response handling; no business logic |
| `services/<name>.service.ts` | Business logic; calls the database or repositories |
| `validators/<name>.validator.ts` | Zod schemas for request body validation |
| `types/<name>.types.ts` | Local TypeScript types (re-export from shared if needed) |
| `tests/<name>.test.ts` | Vitest integration tests via `supertest` |

Use the `auth` module as the canonical reference:

```text
apps/api/src/modules/auth/
  controllers/auth.controller.ts
  services/auth.service.ts
  routes/auth.routes.ts
  validators/auth.validator.ts
  types/auth.types.ts
  tests/auth.test.ts
```

### 3. Register the router in `src/app.ts`

Import and mount the new router alongside the existing ones in
`apps/api/src/app.ts`:

```ts
import { newModuleRouter } from './modules/<name>/routes/<name>.routes.js';

// inside the app setup function:
app.use('/api/<name>', newModuleRouter);
```

### 4. Add shared types (if needed)

If the module introduces types consumed by the web or mobile apps, add them
to `packages/shared/src/types/` and re-export from
`packages/shared/src/index.ts`.

Keep `packages/shared` minimal — only add types that are genuinely used by
more than one app.

### 5. Update the Prisma schema (if needed)

Add models to `apps/api/prisma/schema.prisma`, then regenerate and push:

```bash
pnpm --filter @sidewalk/api exec prisma db push
pnpm --filter @sidewalk/api exec prisma generate
```

Add `@@index` declarations for any fields used in filters or sort orders. See
[docs/persistence/indexing-strategy.md](persistence/indexing-strategy.md)
for the project's indexing conventions.

### 6. Write tests

Every module must include tests in its `tests/` directory. Use `supertest` to
exercise the HTTP layer end-to-end (see `auth/tests/auth.test.ts` as a
reference). The `pretest` script in `apps/api/package.json` resets the SQLite
database before each run so tests start from a clean state.

### 7. Run checks before opening a PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

or simply `pnpm check`.

---

## Coding Standards

- TypeScript strict mode is enabled across all packages.
- Linting: ESLint (flat config) with `typescript-eslint`. Run `pnpm lint`.
- Formatting: Prettier. Run `pnpm exec prettier --write .`.
- Prefer small, focused modules over large multi-purpose files.
- Keep shared abstractions in `packages/shared` minimal — only add things
  that are genuinely used by more than one app.

## Contribution Expectations

- Every PR must pass the relevant GitHub Actions workflow(s) in
  `.github/workflows/`.
- New modules/features should include tests covering the behavior they add.
- Keep changes scoped to the module/app they affect — cross-cutting changes
  to `shared/` or `packages/` should be deliberate and documented in the PR
  description.
- Follow the existing modular monolith structure; do not introduce new
  top-level layers (e.g. global `controllers/`, `services/` directories).

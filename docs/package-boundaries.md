# Package Boundary Rules

This document defines what each package and application in the Sidewalk monorepo owns, what it may depend on, and what it must not do.

---

## Monorepo Shape

```text
sidewalk/
├── apps/
│   ├── api/       # Express modular monolith
│   ├── web/       # Next.js web UI
│   └── mobile/    # Expo / React Native app
└── packages/
    ├── shared/    # Shared types and validation schemas
    └── stellar/   # Stellar integration scaffold
```

---

## Package Rules

### `packages/shared`

**Owns:** TypeScript types, Zod validation schemas, and constants that are consumed by more than one app.

**May depend on:** nothing in this monorepo.

**Must not:**
- Contain business logic or application-level behaviour.
- Import from `apps/*` or `packages/stellar`.
- Grow into a general-purpose utilities dumping ground — every export must have at least two consumers.

---

### `packages/stellar`

**Owns:** Stellar SDK integration, transaction helpers, and verification receipt logic.

**May depend on:** `packages/shared`.

**Must not:**
- Import from any `apps/*` package.
- Contain UI components or HTTP route handlers.
- Hold application configuration (keys, network URLs) — those belong in the consuming app's environment.

---

### `apps/api`

**Owns:** HTTP route handlers, business logic, database access (Prisma), and authentication flows.

Internal structure follows the modular monolith pattern: each domain lives under `src/modules/<domain>/`. Cross-cutting infrastructure (middleware, logger, database client, error types) lives in `src/shared/`.

**May depend on:** `packages/shared`, `packages/stellar`.

**Must not:**
- Import from `apps/web` or `apps/mobile`.
- Put business logic in `src/shared/` — that directory is for infrastructure only.
- Introduce a global `controllers/` or `services/` layer outside of a module directory.

---

### `apps/web`

**Owns:** Next.js pages, React components, and client-side state for the web UI.

**May depend on:** `packages/shared`.

**Must not:**
- Import from `apps/api` or `apps/mobile`.
- Call the Stellar SDK directly — go through `packages/stellar` if Stellar functionality is needed in the browser.
- Duplicate types that already exist in `packages/shared`.

---

### `apps/mobile`

**Owns:** Expo screens, React Native components, navigation, and mobile-specific hooks and services.

**May depend on:** `packages/shared`.

**Must not:**
- Import from `apps/api` or `apps/web`.
- Call the Stellar SDK directly — go through `packages/stellar` if needed.
- Duplicate types that already exist in `packages/shared`.

---

## Dependency Direction

The allowed dependency graph flows in one direction only:

```
apps/* → packages/shared
apps/* → packages/stellar
packages/stellar → packages/shared
```

No package or app may create a circular dependency or import upward from `packages/` into `apps/`.

---

## Adding Something New

| What you are adding | Where it goes |
|---|---|
| Type used by two or more apps | `packages/shared` |
| Stellar SDK call or receipt logic | `packages/stellar` |
| HTTP endpoint or business logic | `apps/api/src/modules/<domain>/` |
| Web UI component or page | `apps/web` |
| Mobile screen or component | `apps/mobile` |
| Cross-cutting API infra (middleware, logger) | `apps/api/src/shared/` |

When in doubt, keep it in the app that needs it first. Move it to a shared package only when a second consumer appears.

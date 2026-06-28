# Package Boundary Rules

## Packages

| Package | Owns | Must not import from |
|---------|------|----------------------|
| `packages/shared` | Types, utils, constants used across apps | Any app package |
| `packages/stellar` | Stellar/Soroban SDK wrappers | `apps/*` |
| `apps/api` | NestJS backend, Prisma, REST routes | `apps/web`, `apps/mobile` |
| `apps/web` | Next.js frontend | `apps/api`, `apps/mobile` |
| `apps/mobile` | React Native app | `apps/api`, `apps/web` |

## Rules

1. **shared is the only cross-app package.** If two apps need the same type, it goes in `packages/shared`.
2. **Apps never import from other apps.** All cross-app contracts go through `packages/shared`.
3. **stellar wraps SDK only.** Business logic lives in `apps/api`, not in the stellar package.
4. **No barrel re-exports that cross boundaries.** Import directly from the owning package.

# Package Rules — Quick Reference

## Import Rules

| From | May import | Must not import |
|------|-----------|-----------------|
| `apps/web` | `packages/shared`, `packages/stellar` | `apps/api`, `apps/mobile` |
| `apps/api` | `packages/shared`, `packages/stellar` | `apps/web`, `apps/mobile` |
| `apps/mobile` | `packages/shared`, `packages/stellar` | `apps/api`, `apps/web` |
| `packages/stellar` | `packages/shared` | Any `apps/*` |
| `packages/shared` | Nothing in this repo | Everything else |

## Adding Shared Types

1. Create `packages/shared/src/types/<name>.ts`
2. Export from `packages/shared/src/index.ts`
3. Import in consuming apps via `@sidewalk/shared`

## Enforcement

ESLint `import/no-restricted-paths` runs in CI.
Run `pnpm lint` locally to catch violations before pushing.

# Package Boundary Clarifications

## Core Rule

No app package may import from another app package. All shared code lives in `packages/`.

## Decision Tree

```
Is the code used by more than one app?
  YES → Put it in packages/shared (types, utils) or packages/stellar (SDK wrappers)
  NO  → Keep it inside the owning app
```

## Common Mistakes

| Wrong | Right |
|-------|-------|
| `apps/web` imports from `apps/api/src/...` | Define shared type in `packages/shared` |
| `packages/stellar` calls `apps/api` services | Move business logic to `apps/api` |
| Duplicate type definitions across apps | Single source of truth in `packages/shared` |

## Enforcement

ESLint `import/no-restricted-paths` rules are configured in `eslint.config.mjs`.
Violations will fail CI.

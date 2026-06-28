# Cross-Package Review Checklist

Use this checklist when reviewing a pull request that touches more than one package or application in the monorepo (e.g. a change to `packages/shared` alongside a change in `apps/api`).

---

## When to apply this checklist

Apply it whenever a PR modifies files in:

- `packages/shared` **and** at least one app, or
- `packages/stellar` **and** at least one app, or
- two or more apps at once, or
- any `packages/*` entry point (`index.ts`, exported types).

Single-app changes that stay entirely within one `apps/*` directory do not require this checklist.

---

## Checklist

### Dependency direction

- [ ] No `apps/*` package imports from another `apps/*` package.
- [ ] No `packages/*` package imports from `apps/*`.
- [ ] `packages/stellar` does not import from anything other than `packages/shared`.
- [ ] No new circular dependencies are introduced (`pnpm check` or `tsc --noEmit` across the workspace stays clean).

### Shared package changes (`packages/shared`, `packages/stellar`)

- [ ] Every new export in `packages/shared` is consumed by at least two packages/apps (or a follow-up issue is filed to track the second consumer).
- [ ] No business logic or application-specific behaviour has been added to `packages/shared`.
- [ ] Stellar SDK calls and receipt logic land in `packages/stellar`, not in `apps/*` directly.
- [ ] Public API changes (renamed or removed exports) are reflected in every consumer in the same PR.

### Type safety

- [ ] `pnpm typecheck` passes across the full workspace with no new errors.
- [ ] No types are duplicated across packages — if the same shape appears in two places, it belongs in `packages/shared`.

### Tests

- [ ] Behaviour added or changed in a shared package is covered by tests in that package (or, if only validated by build/lint, that is explicitly noted in the PR description).
- [ ] Consumer apps that are affected by the shared change have their own tests updated to reflect the new behaviour.
- [ ] `pnpm test` passes across all affected packages.

### CI

- [ ] All GitHub Actions workflows triggered by the PR are green (lint, typecheck, test, build).
- [ ] No workflow is skipped or has its failure silenced without a documented reason.

### PR description

- [ ] The description explains why the change needs to touch multiple packages rather than staying in one.
- [ ] Any intentional deviation from the [package boundary rules](package-boundaries.md) is called out explicitly.
- [ ] Breaking changes to shared types or interfaces are highlighted so dependent teams can prepare.

---

## Quick reference: allowed dependency graph

```
apps/api     → packages/shared, packages/stellar
apps/web     → packages/shared
apps/mobile  → packages/shared
packages/stellar → packages/shared
```

Any import that flows against this graph is a boundary violation and must be resolved before merge.

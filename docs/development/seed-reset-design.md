# Seed and Reset Helpers — Design Phase

This document is a scaffold for
[#543 — Design seed and reset helpers for a richer local development dataset](https://github.com/MixMatch-Inc/Sidewalk/issues/543).

A design-phase note that captures decisions before any
`seed.ts` or `reset-db.ts` is written. Implementation-PR
counterpart: #548.

## 1. Goals

- One-command seed that exercises auth, reports, and audit
  surfaces end-to-end against the SQLite dev DB.
- One-command reset that returns the local DB to a known-clean
  state without manual file deletion.
- Both commands reachable via `pnpm` filters from the repo
  root, matching [environment.md](../environment.md).

`TODO`: enumerate exact user roles / sample counts once the
report module ships its fixtures (see #555).

## 2. Design Principles

- **Idempotency.** All seed operations are `upsert`-based and
  re-runnable without unique-constraint errors.
- **Composability.** Each fixture block is independent — removing
  one does not invalidate the others.
- **Locality.** Helpers run only against the SQLite dev DB;
  no network calls; no production targets.

## 3. API Surface

- `pnpm --filter @sidewalk/api db:seed [--with=auth,reports,audit]`
- `pnpm --filter @sidewalk/api db:reset [--with-seed] [--keep-schema]`

`TODO`: confirm whether `db:seed` is the same script as
`prisma db seed`, or whether we add `db:seed:full` that calls
`db:seed` plus extras.

## 4. Seed Inventory (provisional)

- `users` — ~5 records (1 admin + 4 ordinary).
- `reports` — ~10 records spanning every status.
- `moderationEvents` — ~5 records.

`TODO`: replace placeholders with concrete counts once #555
lands its `Report` shape.

## 5. Reset Workflow

1. Set a "reject connections" flag in
   `apps/api/src/shared/database/prisma.ts`.
2. `$disconnect()` the Prisma client.
3. Unlink the SQLite file referenced by `DATABASE_URL`.
4. Re-run `prisma db push` to recreate the empty schema.
5. Optionally re-seed (gated by `--with-seed`).

`TODO`: confirm step 1's flag pattern (signal file vs feature
flag vs route middleware).

## 6. Validation

- Re-running `db:seed` against an already-seeded DB produces
  no errors.
- `db:reset --with-seed` returns the DB to a fully populated
  state from a single command.
- `pnpm --filter @sidewalk/api typecheck` and `test` still pass.

## 7. Open Questions

- Idempotency via bcrypt-hashed passwords (`auth.service.register`)
  vs direct `passwordHash` insertion — coverage vs speed trade.
- Helpers live in `apps/api/scripts/` or `apps/api/prisma/`?
- Out of scope: production seed (kept purely local-dev).

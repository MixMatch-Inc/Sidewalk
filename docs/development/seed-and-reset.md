# Seed and Reset Helpers for Local Development

This document is a scaffold for
[#548 — Add seed and reset helpers for a richer local development dataset](https://github.com/MixMatch-Inc/Sidewalk/issues/548).

It captures the shape of the helpers needed so the final implementation
PR can fill in concrete functions without restructuring the directory
layout or the package scripts.

## 1. Goals

- One-command seed of a richer local SQLite dataset that exercises
  auth, reports, and audit surfaces end-to-end.
- One-command reset that returns the local database to a known-clean
  state without forcing the user to delete files by hand.
- Both commands run from the repo root via `pnpm` filters, matching
  the monorepo convention documented in
  [environment.md](../environment.md).

`TODO`: enumerate exact user roles / sample counts once the report
module ships its `Report` and `ReportDraft` fixtures (see
[#550](https://github.com/MixMatch-Inc/Sidewalk/issues/550)).

## 2. Script Layout

`apps/api/prisma/` is the conventional Prisma location for seed
configuration, and a sibling `scripts/` directory under `apps/api/`
is the conventional location for non-seed helpers (reset, migration
utilities, etc.) that do not fit Prisma's seed contract:

```text
apps/api/
  prisma/
    schema.prisma       (existing)
    seed.ts             (added by this issue — see §3)
  scripts/
    reset-db.ts         (added by this issue — see §4)
```

`TODO`: confirm with maintainers whether the `@sidewalk/api`
`package.json` needs a `"prisma": { "seed": "..." }` entry, or
whether the existing `pnpm --filter @sidewalk/api exec prisma db seed`
invocation is sufficient given the `pretest` hook in
[testing.md](../testing.md).

## 3. Seed Shape (`apps/api/prisma/seed.ts`)

The seed should be **idempotent** — `upsert`-based — so re-running it
does not error on unique-constraint collisions. Suggested dataset
blocks:

| Block              | Records | Purpose                                       |
| ------------------ | ------- | --------------------------------------------- |
| `users`            | ~5      | Auth surface coverage (one admin, four users). |
| `reports`          | ~10     | Per-user submissions across statuses.          |
| `moderationEvents` | ~5      | Audit timeline fixtures.                       |

`TODO`: replace the placeholder counts with the chosen fixture
shape once [#550](https://github.com/MixMatch-Inc/Sidewalk/issues/550)
and [#551](https://github.com/MixMatch-Inc/Sidewalk/issues/551) land
the underlying models. Until then, only the `users` block is safe to
seed against the current schema.

## 4. Reset Workflow (`apps/api/scripts/reset-db.ts`)

The reset helper must:

1. Delete the SQLite file referenced by `DATABASE_URL` in
   [`apps/api/.env.test`](../../apps/api/.env.test) (or the
   equivalent local `.env`).
2. Re-run `prisma db push` to recreate the empty schema.
3. Optionally re-run the seed, gated by a `--with-seed` flag.

Allowed access patterns: shell out via `child_process`, or import
the Prisma client and call `$disconnect()` before unlinking. `TODO`
in the implementation file marks the chosen path.

`TODO`: confirm whether `pretest` (per
[testing.md](../testing.md)) already covers this and the
`reset-db.ts` script is therefore only needed for *ad-hoc* developer
resets. If yes, the script is optional; if no, it is required for
CI parity.

## 5. Package Scripts

Add the following entries to `apps/api/package.json` (replace `tsx`
with whichever TS execution tool `@sidewalk/api` already depends on
— `tsx`, `ts-node`, etc. — see §7):

```json
{
  "scripts": {
    "db:seed": "prisma db seed",
    "db:reset": "tsx scripts/reset-db.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

`TODO`: validate the exact script names match the project's
convention by checking other apps and shared packages for analogous
`db:*` entries. Adopt their style; do not invent a new prefix.

## 6. Validation

- `pnpm --filter @sidewalk/api db:seed` runs without error against a
  fresh SQLite DB.
- `pnpm --filter @sidewalk/api db:reset --with-seed` returns the DB
  to a fully seeded state from a single command.
- `pnpm --filter @sidewalk/api typecheck` still passes.
- `pnpm --filter @sidewalk/api test` still passes (audit fixtures
  must not collide with hand-rolled test data).

## 7. Open Questions

- Is `tsx` already a dev-dependency of `@sidewalk/api`? If not, the
  implementation PR will need to add it; flag the install footprint
  in the PR description.
- Do we seed `passwordHash` values directly (faster) or call
  `auth.service.register` for each one (slower but exercises the
  bcrypt path)? Pick whichever matches the team's habits in other
  services.
- Should fixtures live in `apps/api/prisma/fixtures/*.json` rather
  than be inlined in `seed.ts`? That decision belongs to whoever
  picks up this issue in earnest.

# Seed and Reset Workflow

This document describes how to seed your local SQLite database with development
fixtures and how to reset it to a clean state when something goes wrong.

## Prerequisites

The scripts below use `dotenv-cli` and `tsx`, both already present as
dev-dependencies in `apps/api/package.json`. All commands run from the
repo root unless noted otherwise.

---

## Local Reset

Resetting returns the local SQLite database to an empty, schema-correct state.

### Quick reset (recommended)

The `pretest` hook in `apps/api/package.json` already does a full reset:

```bash
pnpm --filter @sidewalk/api exec dotenv -e .env.test -- prisma db push --force-reset --skip-generate
```

You can run the same command against your development `.env` to reset your
local dev database:

```bash
pnpm --filter @sidewalk/api exec dotenv -e .env -- prisma db push --force-reset --skip-generate
```

`--force-reset` drops the existing SQLite file and recreates it from the
current schema. `--skip-generate` is safe here because the Prisma client was
already generated at build/typecheck time.

### What `--force-reset` does

1. Deletes the SQLite database file referenced by `DATABASE_URL` in your
   `.env` (or `.env.test`).
2. Recreates the file and applies the current `schema.prisma` in one step.

No data is preserved. This is intentional — the goal is a known-clean state.

---

## Seeding

After a reset you may want to populate the database with enough data to
exercise the app end-to-end.

### Run the seed

```bash
pnpm --filter @sidewalk/api exec dotenv -e .env -- prisma db seed
```

The seed script is located at `apps/api/prisma/seed.ts` and is registered in
`apps/api/package.json` under `"prisma": { "seed": "tsx prisma/seed.ts" }`.

The seed is **idempotent** — it uses `upsert` calls so re-running it on an
already-seeded database is safe.

### What the seed creates

| Block | Records | Purpose |
| ----- | ------- | ------- |
| `users` | ~5 | Auth surface coverage (one admin, four regular users) |
| `reports` | ~10 | Per-user submissions spread across all valid statuses |
| `moderationEvents` | ~5 | Audit timeline fixtures for the moderation surface |

> **Note:** The `reports` and `moderationEvents` blocks depend on the `Report`
> and `Moderation` models defined in `schema.prisma`. If those models are not
> yet present in your branch, only the `users` block will seed successfully.

---

## Reset + seed in one step

```bash
pnpm --filter @sidewalk/api exec dotenv -e .env -- prisma db push --force-reset --skip-generate \
  && pnpm --filter @sidewalk/api exec dotenv -e .env -- prisma db seed
```

---

## Switching between dev and test databases

The API uses two separate SQLite files:

| Environment | File (set by `DATABASE_URL`) | Used by |
| ----------- | --------------------------- | ------- |
| Development | `apps/api/prisma/dev.db` (default in `.env`) | `pnpm dev:api` |
| Test | `apps/api/prisma/test.db` (default in `.env.test`) | `pnpm test` |

The `pretest` script resets and regenerates the **test** database automatically
before every `pnpm test` run. You do not need to manage the test database by
hand.

---

## Troubleshooting

**`P1000` / "unable to open database file"**
The directory referenced by `DATABASE_URL` does not exist. Create it:
```bash
mkdir -p apps/api/prisma
```

**"The table `X` does not exist"**
The schema has not been pushed yet. Run:
```bash
pnpm --filter @sidewalk/api exec dotenv -e .env -- prisma db push
```

**Prisma client out of date after a schema change**
Regenerate the client:
```bash
pnpm --filter @sidewalk/api exec prisma generate
```

**Seed fails with unique-constraint errors**
The database already contains conflicting data. Reset first, then seed:
```bash
pnpm --filter @sidewalk/api exec dotenv -e .env -- prisma db push --force-reset --skip-generate
pnpm --filter @sidewalk/api exec dotenv -e .env -- prisma db seed
```

# Local Reset — Persistence Guide

## Full Reset

```bash
cd apps/api
pnpm prisma migrate reset --force
```

This will: drop all tables, re-run all migrations, and run the seed script.

## Partial Reset (data only)

```bash
cd apps/api
pnpm prisma db execute --file scripts/truncate.sql
```

Create `scripts/truncate.sql` with:
```sql
DELETE FROM reports;
DELETE FROM sessions;
DELETE FROM users;
```

## Regenerate After Schema Change

```bash
pnpm prisma generate      # regenerates the Prisma client
pnpm prisma migrate dev   # applies any pending migrations
```

## Test Environment

Tests use an in-memory SQLite instance. The shared `resetTables()` helper
clears all rows before each suite without dropping the schema.

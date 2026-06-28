# Persistence Reset Workflow

## Quick Reset (Development)

```bash
cd apps/api
pnpm prisma migrate reset --force   # drops DB, re-runs migrations, seeds
```

## Manual Step-by-Step

```bash
# Delete the SQLite file
rm -f prisma/dev.db

# Apply migrations
pnpm prisma migrate dev --name init

# Regenerate client
pnpm prisma generate

# Seed data
pnpm prisma db seed
```

## When to Reset

- After pulling changes that include new migrations
- After a failed migration left the schema in a broken state
- When switching between feature branches with conflicting schemas

## Avoiding State Leaks in Tests

Use the shared `resetTables()` helper before each test suite:

```ts
import { resetTables } from "@sidewalk/shared/test-utils";
beforeEach(() => resetTables(prisma));
```

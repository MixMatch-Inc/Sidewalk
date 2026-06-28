# Local Reset Workflow

Use this guide to fully reset your local development environment.

## 1. Reset the Database

```bash
# Drop and recreate the SQLite database
rm -f apps/api/prisma/dev.db
cd apps/api
pnpm prisma migrate reset --force
pnpm prisma db push
pnpm prisma db seed
```

## 2. Regenerate Prisma Client

```bash
cd apps/api
pnpm prisma generate
```

## 3. Regenerate Stellar/Soroban Clients (if applicable)

```bash
cd packages/stellar
pnpm build
```

## 4. Restart All Services

```bash
# From repo root
pnpm dev
```

## Troubleshooting

- **"Table already exists" error** — Run `prisma migrate reset --force` to wipe migrations.
- **Type errors after schema change** — Re-run `prisma generate` and restart TS server.
- **Stale generated client** — Delete `node_modules/.prisma` and regenerate.

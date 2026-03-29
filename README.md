# 🛣️ Sidewalk

[![CI](https://github.com/MixMatch-Inc/Sidewalk/actions/workflows/ci.yml/badge.svg)](https://github.com/MixMatch-Inc/Sidewalk/actions/workflows/ci.yml)

Sidewalk is a civic reporting monorepo. It currently contains:

- `apps/api`: Express API for auth, reports, media uploads, health checks, and background jobs
- `apps/web`: Next.js web app shell for diagnostics and future citizen/admin workflows
- `apps/mobile`: Expo React Native app
- `packages/stellar`: shared Stellar integration package

The repository uses `pnpm` workspaces as the source of truth. Use `pnpm`, not `npm`, for install and workspace tasks.

## Workspace layout

```text
sidewalk/
├── apps/
│   ├── api/
│   ├── mobile/
│   └── web/
├── packages/
│   └── stellar/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Prerequisites

- Node.js 20 or later
- pnpm 9
- MongoDB for the API
- Redis for BullMQ-backed workers
- Stellar testnet account secret for anchoring flows
- Expo Go or emulator tooling for mobile work

## Bootstrap

```bash
pnpm install
```

Root workspace scripts:

- `pnpm dev:api`
- `pnpm dev:web`
- `pnpm dev:mobile`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm check`

## Environment setup

Current runtime requirements come primarily from the API and workers:

- `MONGO_URI`
- `JWT_SECRET`
- `STELLAR_SECRET_KEY`
- `REDIS_URL` for queue-backed media processing and Stellar anchoring
- S3 variables required by the media module
- `RESEND_API_KEY` if OTP email delivery should send real emails

If Redis or Resend are missing, some flows already degrade safely:

- media queue falls back to storing originals without worker processing
- Stellar anchor queue stays unavailable without crashing the API
- OTP email delivery logs codes instead of sending them

## Running the apps

Backend API:

```bash
pnpm dev:api
```

Web app:

```bash
pnpm dev:web
```

Mobile app:

```bash
pnpm dev:mobile
```

## Local quality checks

Run the full workspace checks:

```bash
pnpm check
```

Or run package-specific checks:

```bash
pnpm --filter sidewalk-api lint
pnpm --filter sidewalk-api typecheck
pnpm --filter sidewalk-api build

pnpm --filter sidewalk-web lint
pnpm --filter sidewalk-web typecheck
pnpm --filter sidewalk-web build

pnpm --filter mobile lint
pnpm --filter mobile typecheck

pnpm --filter @sidewalk/stellar lint
pnpm --filter @sidewalk/stellar typecheck
pnpm --filter @sidewalk/stellar build
```

## Notes for contributors

- Each app/package should remain independently buildable from `main`
- Shared logic belongs in `packages/*` only when it is stable enough for cross-app reuse
- Prefer additive changes that do not assume other branches have been merged

## License

MIT

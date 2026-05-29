# Sidewalk

Sidewalk is being rebuilt as a clean open source hackathon starter for civic reporting, identity, and trust workflows.

This repository now starts from a fresh monorepo baseline built around:

- `apps/api`: Express API for authentication-first MVP development
- `apps/web`: Next.js web app for contributor-facing product work
- `apps/mobile`: Expo mobile workspace for mobile-first flows
- `apps/stellar-service`: Stellar integration service for wallets, receipts, and network-facing tasks
- `packages/config`: shared runtime and environment helpers
- `packages/types`: shared TypeScript contracts

## Product rebuild order

We are restarting from scratch and building the MVP in this order:

1. Authentication
2. Identity and user profile
3. Reporting workflows
4. Public case tracking
5. Stellar-backed verification and receipts
6. Notifications and trust signals
7. Admin and moderation
8. Mobile resilience and offline support
9. Observability, security, and release readiness

## Getting started

Prerequisites:

- Node.js 20+
- pnpm 10+

Install dependencies:

```bash
pnpm install
```

Run the core workspaces:

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:mobile
pnpm dev:stellar
```

Quality checks:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

## Environment

Each runtime ships with a local `.env.example`:

- `apps/api/.env.example`
- `apps/stellar-service/.env.example`
- `apps/web/.env.example`
- `apps/mobile/.env.example`

The initial scaffold intentionally keeps secrets and third-party dependencies minimal so contributors can onboard quickly during hackathon work.

## Contributing

This repo is being prepared for public contributors. Keep changes scoped, document new environment variables, and prefer shared contracts in `packages/types` when multiple apps need the same shape.

## Contributor planning docs

- [API to Stellar service trust handshake](docs/service-trust-handshake.md)

## License

MIT

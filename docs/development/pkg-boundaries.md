# Package Boundaries — Description

## Overview

Sidewalk is a modular monorepo. Each package/app has a defined boundary.
Respecting these boundaries keeps the codebase maintainable as new civic
modules are added.

## Package Map

```
packages/
  shared/     → types, utils, constants — imported by all apps
  stellar/    → Stellar SDK helpers — imported by api and mobile

apps/
  api/        → NestJS REST backend — the single source of truth for data
  web/        → Next.js frontend — calls api over HTTP only
  mobile/     → React Native app — calls api over HTTP only
```

## What Belongs Where

- Shared type? → `packages/shared`
- Stellar contract call? → `packages/stellar`
- HTTP route handler? → `apps/api`
- Page or component? → `apps/web` or `apps/mobile`
- Business rule? → `apps/api` service layer

## Detecting Violations

```bash
pnpm lint   # ESLint import rules catch cross-app imports at CI time
```

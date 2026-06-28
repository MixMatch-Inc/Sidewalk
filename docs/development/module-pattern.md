# Modular Monolith — Module Pattern

## What is a Module?

A module is a self-contained slice of the backend that owns one domain concept
(e.g., `reports`, `users`, `notifications`).

## Folder Convention

```
apps/api/src/modules/
  reports/
    reports.module.ts      # NestJS module declaration
    reports.controller.ts  # HTTP handlers
    reports.service.ts     # Business logic
    reports.dto.ts         # Request/response shapes
    reports.service.spec.ts # Unit tests
```

## Rules

- One module per domain concept.
- Services hold all logic — controllers only call services.
- Modules must not directly import other modules' services; use shared interfaces.
- Shared types belong in `packages/shared`, not inside the module.

## Registering

```ts
// apps/api/src/app.module.ts
@Module({ imports: [ReportsModule, UsersModule] })
export class AppModule {}
```

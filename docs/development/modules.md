# Adding New Modules — Quick Guide

## NestJS Module Checklist

```
apps/api/src/modules/<name>/
  <name>.module.ts      # @Module() declaration
  <name>.controller.ts  # Route handlers
  <name>.service.ts     # Business logic + DB access
  <name>.dto.ts         # Zod or class-validator DTOs
```

## Shared Types Checklist

```
packages/shared/src/types/<name>.ts   # interface definitions
packages/shared/src/index.ts          # re-export here
```

## Database Checklist

```bash
# Add model to schema.prisma, then:
pnpm prisma migrate dev --name add-<name>
pnpm prisma generate
```

## Registration

```ts
// apps/api/src/app.module.ts
@Module({ imports: [...existingModules, NewModule] })
export class AppModule {}
```

## Testing

- Unit tests: `<name>.service.spec.ts` beside the service
- Integration tests: use helpers from `packages/shared/src/__tests__/`

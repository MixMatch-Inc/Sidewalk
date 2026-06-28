# Adding a New Module Under the Modular Monolith Pattern

## Steps

### 1. Define the domain boundary
Decide which app owns the module (`api`, `web`, or `mobile`).
If the module exposes shared types, add them to `packages/shared`.

### 2. Create the folder structure
```
apps/api/src/modules/<module-name>/
  <module-name>.module.ts
  <module-name>.controller.ts
  <module-name>.service.ts
  <module-name>.dto.ts
```

### 3. Register the module
Import and add to `AppModule` in `apps/api/src/app.module.ts`.

### 4. Add shared types (if needed)
Place in `packages/shared/src/types/<module-name>.ts` and export from the package index.

### 5. Add tests
Create `apps/api/src/modules/<module-name>/<module-name>.service.spec.ts`.

### 6. Update docs
Add a row to `docs/development/package-boundaries.md` if the module crosses boundaries.

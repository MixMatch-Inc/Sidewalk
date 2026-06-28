# How to Add a New Module

## Overview

New civic features (e.g. `permits`, `events`, `notifications`) are added as
NestJS modules inside `apps/api/src/modules/`.

## Step-by-Step

1. **Create the module folder**
   ```
   apps/api/src/modules/permits/
     permits.module.ts
     permits.controller.ts
     permits.service.ts
     permits.dto.ts
   ```

2. **Define shared types** (if web/mobile will consume them)
   ```
   packages/shared/src/types/permits.ts
   ```
   Export from `packages/shared/src/index.ts`.

3. **Add a Prisma model** (if persistence is needed)
   Edit `apps/api/prisma/schema.prisma`, then run:
   ```bash
   pnpm prisma migrate dev --name add-permits
   ```

4. **Register in AppModule**
   ```ts
   // app.module.ts
   imports: [AuthModule, ReportsModule, PermitsModule]
   ```

5. **Write tests** in `permits.service.spec.ts`.

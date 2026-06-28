# Repo Bootstrap for Auth Starter Contributors

## Prerequisites

- Node.js 20+
- pnpm 9+
- Git

## Steps

```bash
# 1. Clone the repo
git clone https://github.com/MixMatch-Inc/Sidewalk.git
cd Sidewalk

# 2. Install all workspace dependencies
pnpm install

# 3. Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Set up the database
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
cd ../..

# 5. Start all services
pnpm dev
```

## Verify the Setup

- API: http://localhost:3001/health should return `{"status":"ok"}`
- Web: http://localhost:3000 should load the landing page

## Auth Starter Defaults

- Seed user: `dev@sidewalk.local` / `password123`
- JWT secret is set in `apps/api/.env` — do not commit real secrets.

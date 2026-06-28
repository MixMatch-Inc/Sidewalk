# Repository Bootstrap Guide

## First-Time Setup

```bash
git clone https://github.com/MixMatch-Inc/Sidewalk.git && cd Sidewalk
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cd apps/api && pnpm prisma migrate dev && pnpm prisma db seed && cd ../..
pnpm dev
```

## Verify Services

| Service | URL | Expected |
|---------|-----|----------|
| API | http://localhost:3001/health | `{"status":"ok"}` |
| Web | http://localhost:3000 | Landing page loads |

## Auth Starter Notes

The repo ships with a working auth flow. After seeding:
- Login at `/login` with `dev@sidewalk.local` / `password123`
- JWT is stored as an HTTP-only cookie
- Protected routes redirect to `/login` without a valid token

## Updating After a Pull

```bash
pnpm install            # picks up new dependencies
cd apps/api && pnpm prisma migrate dev   # applies new migrations
```

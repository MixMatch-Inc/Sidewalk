# Cross-Package Change Review Checklist

Use this checklist when a PR touches more than one package in the monorepo.

## Before Merging

- [ ] Changes to `packages/shared` are backward-compatible or all consumers are updated
- [ ] New exports in `packages/shared` are re-exported from the package index
- [ ] API and web packages compile after the change (`pnpm build`)
- [ ] No circular imports introduced between packages
- [ ] Types are exported from the correct package (shared vs. app-local)
- [ ] Migrations in `apps/api` are in sync with Prisma schema changes
- [ ] Environment variables added to `.env.example` and `docs/environment.md`
- [ ] Tests pass in all affected packages (`pnpm test`)

## Notes

- Use `pnpm --filter <package> <command>` to run commands in a single package.
- Run `pnpm turbo run build test` from the root to validate the full graph.

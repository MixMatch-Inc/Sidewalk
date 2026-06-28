# Pull Request Checklist

Complete this checklist before requesting review.

## Code Quality

- [ ] No `console.log` left in production code paths
- [ ] No commented-out code blocks
- [ ] Functions are named clearly — no single-letter variables in non-trivial logic
- [ ] TypeScript strict mode satisfied — no `any` without a comment explaining why

## Tests

- [ ] New behaviour is covered by at least one test
- [ ] Existing tests still pass: `pnpm test`
- [ ] Test file lives next to the file it tests (`*.spec.ts` or `__tests__/`)

## Documentation

- [ ] Public API changes reflected in `docs/api/`
- [ ] New environment variables added to `.env.example` and `docs/environment.md`
- [ ] Breaking changes noted at the top of the PR description

## PR Description

- [ ] Summary explains the *why*, not just the *what*
- [ ] All related issues linked with `closes #NNN`
- [ ] Screenshots included for UI changes

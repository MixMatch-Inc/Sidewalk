# Git Workflow Instructions for Sidewalk Mobile MVP Enhancements

## Step 1: Create a Feature Branch
```bash
cd /workspaces/Sidewalk
git checkout -b feat/mobile-mvp-enhancements main
```

## Step 2: Stage All Changes
```bash
git add -A
```

## Verify Changes
```bash
git status
```

You should see these files:

### New Files
- `apps/mobile/app/lib/analytics.ts`
- `apps/mobile/app/lib/report-cache.ts`
- `apps/mobile/app/lib/public-report-link.ts`

### Modified Files
- `apps/mobile/app/lib/session-storage.ts`
- `apps/mobile/app/lib/use-report-deep-link.ts`
- `apps/mobile/app/providers/session-provider.tsx`
- `apps/mobile/app/(auth)/login.tsx`
- `apps/mobile/app/index.tsx`
- `apps/mobile/app/(app)/reports/[reportId].tsx`
- `apps/mobile/app/(app)/(tabs)/reports.tsx`
- `apps/mobile/app/(app)/reports/new.tsx`

## Step 3: Commit Changes
```bash
git commit -m "feat(mobile): MVP enhancements - analytics, caching, deep-linking, session hardening

- Add analytics infrastructure with configurable adapter pattern
- Implement public report URL parsing and deep-link handling
- Harden session restore with validation and auto-recovery
- Add lightweight report caching with stale data indicators
- Instrument auth, report creation, upload, and discovery flows
- Add share functionality to report detail screen

Closes #215
Closes #216
Closes #217
Closes #218"
```

## Step 4: Push to Remote
```bash
git push origin feat/mobile-mvp-enhancements
```

## Step 5: Create Pull Request
Visit: https://github.com/MixMatch-Inc/Sidewalk/pull/new/feat/mobile-mvp-enhancements

**Title:**
```
feat(mobile): MVP enhancements - analytics, deep-linking, caching, session hardening
```

**Description:**
```
## Summary
Implements four critical mobile MVP enhancements to improve reliability, discoverability, and instrumentation.

## Changes

### Analytics Instrumentation (#218)
- Extensible event taxonomy covering all key flows
- No-op adapter by default, production-ready interface
- Privacy-conscious: excludes sensitive report content
- Events tracked: auth (OTP, session restore), reports (list, detail, create, upload, deep-link)

### Public Report URL Parsing (#217)
- Parses shared report URLs from deep-links
- Proper routing for authenticated and unauthenticated users
- Graceful fallback for unsupported links
- Analytics tracking on deep-link opens

### Session Restore Hardening (#216)
- Validates stored session payloads before use
- Type checking for tokens and timestamps
- Automatic recovery on corrupted state
- Prevents boot loops from malformed storage

### Report Caching (#215)
- Lightweight LRU-style cache for recently viewed reports
- Stale data indicators with timestamps
- Graceful offline support and automatic revalidation
- Applies to both list and detail screens

## Closes
- Closes #215
- Closes #216
- Closes #217
- Closes #218

## Testing
- [ ] Verify analytics events flow correctly
- [ ] Test deep-link routing for both auth states
- [ ] Confirm session recovery from corruption
- [ ] Validate cached data displays offline
- [ ] Check share button functionality
```

## PR Link
After creating the PR, the system will automatically link it to the issues.

---

**Due Date:** April 29, 2026
**Status:** Ready for review and testing

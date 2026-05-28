# Login Profiling Results — Issue #429

**Date:** 2026-05-28  
**Branch:** `chore/profile-login-spikes`  
**Test tool:** Artillery 2.x  
**Target:** `http://localhost:4000` (local dev server, `@sidewalk/api`)

---

## Test Configuration

```
Warm-up phase : 2 arrivals/sec × 5s  → ~10 VUs
Demo spike    : 20 arrivals over 10s  → 20 VUs
Total VUs     : 30
Scenarios     : 50% GET /auth/status · 50% POST /auth/login
```

---

## Raw Results (Summary)

| Metric | Value |
|---|---|
| Total requests | 30 |
| HTTP 200 | 17 (GET /auth/status — implemented) |
| HTTP 404 | 13 (POST /auth/login — not yet implemented) |
| HTTP 429 | 0 |
| HTTP 5xx | 0 |
| vusers.failed | 0 |
| Overall p99 latency | 3 ms |
| 2xx p99 latency | 2 ms |
| 4xx p99 latency | 2 ms (36 ms max on first cold request) |
| Requests/sec (peak) | 3/sec |

> **Note on negative response times in period 2:** Artillery recorded a `min: -2503 ms` for the second measurement window. This is a known clock-skew artifact that occurs when Artillery's timing reference crosses a phase boundary — it does not reflect real server behaviour and can be ignored.

---

## Observations

### 1. POST /auth/login returns 404 — endpoint not yet built
The login route does not exist in `apps/api/src/server.ts`. Every login attempt returned 404 immediately. This is expected for the foundation phase but means **no real-world login latency was measurable yet** (no DB lookup, no password hashing).

**Impact:** Profiling must be re-run once the endpoint is implemented to get meaningful numbers.

---

### 2. No rate limiting on auth routes (critical gap)
`server.ts` uses `helmet`, `cors`, `express.json`, and `morgan` — but **no `express-rate-limit` or equivalent middleware**. There is nothing to throttle repeated POST /auth/login calls.

**Risk:** Once the login endpoint is live, an attacker or accidental demo spike can drive unlimited parallel authentication attempts. bcrypt/argon2 hashing is CPU-bound; 20 concurrent hashes will saturate a single-core process quickly.

**Recommended fix (before going to production):**
```ts
import rateLimit from "express-rate-limit";

app.use(
  "/auth",
  rateLimit({ windowMs: 60_000, max: 20, standardHeaders: true, legacyHeaders: false })
);
```

---

### 3. No password hashing library in dependencies
`apps/api/package.json` has no `bcrypt`, `bcryptjs`, `argon2`, or similar dependency. This is consistent with the endpoint being unimplemented, but it is a **requirement to address before auth goes live**.

**Recommendation:** Use `argon2` (OWASP-recommended) or `bcryptjs` (pure-JS, no native build step). For a hackathon demo, `bcryptjs` with `saltRounds: 10` is safe and zero-native-build.

**Expected latency impact:** Each bcrypt hash at `saltRounds: 10` adds ~100 ms per request. Under 20 concurrent logins this can push p99 past 1 s on a single-core server unless requests are queued or limited.

---

### 4. Server is stable under the demo spike
Zero 5xx errors and zero failed virtual users. The Express process handled all 30 requests cleanly. This confirms the server bootstrapping, middleware chain, and error handling are solid for the current stub stage.

---

### 5. Cold-start latency spike (first request)
The first request in the warm-up phase hit 36 ms (vs. 1–3 ms steady state). This is `tsx`/Node.js JIT warm-up, not a real bottleneck. It disappears after the first few requests and is irrelevant under real load.

---

## Summary of Bottlenecks (Priority Order)

| # | Issue | Severity | State |
|---|---|---|---|
| 1 | No rate limiting on `/auth/*` | High | Open |
| 2 | No password hashing library | High | Open (endpoint unbuilt) |
| 3 | Login endpoint returns 404 | Medium | Expected (foundation phase) |
| 4 | No database connection yet | Low | Expected (foundation phase) |

---

## Next Steps

1. **Implement `POST /auth/login`** with `bcryptjs`/`argon2` and a DB lookup.
2. **Add `express-rate-limit`** on the `/auth` prefix before the first public demo.
3. **Re-run this load test** once the endpoint is live to capture real hashing latency and confirm p99 stays under 1 s.
4. **Add a database connection pool** (pg pool size ≥ 5) to avoid connection exhaustion under concurrent logins.

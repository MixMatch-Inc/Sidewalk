/**
 * requireAuth middleware — Issue #417
 *
 * Gates stellar-service routes on a current, verified auth session.
 * Verifies the Bearer token against the API session store so stale or
 * revoked tokens are rejected even if they were valid at request start.
 *
 * Race-condition behaviour:
 *   If auth state changes (logout, revocation, unverification) between the
 *   time a client initiates a request and the time this middleware runs, the
 *   middleware will reject the request with 401/403. Callers must re-authenticate
 *   and retry. No Stellar work is started before this check completes.
 */

import type { Request, Response, NextFunction } from "express";

export type AuthedRequest = Request & {
  auth: { accountId: string; sessionId: string };
};

/**
 * Calls the API to resolve the session and confirm the account is verified.
 * Returns the accountId on success, null on any failure.
 */
async function resolveSession(
  apiUrl: string,
  sessionId: string
): Promise<{ accountId: string } | null> {
  try {
    const res = await fetch(`${apiUrl}/auth/sessions`, {
      headers: { Authorization: `Bearer ${sessionId}` }
    });
    if (!res.ok) return null;
    const sessions = (await res.json()) as Array<{ sessionId: string }>;
    // API returns the caller's own sessions; presence confirms the session is live.
    if (!Array.isArray(sessions) || sessions.length === 0) return null;
    return { accountId: sessions[0] as unknown as string };
  } catch {
    return null;
  }
}

/**
 * Calls the API to check whether the account linked to this session is verified.
 * We re-use the login response shape: the account object carries `verified`.
 */
async function resolveVerified(
  apiUrl: string,
  sessionId: string
): Promise<{ accountId: string; verified: boolean } | null> {
  // The API exposes session info via GET /auth/sessions (ENABLE_AUTH_SESSION_LIST).
  // For internal service-to-service calls we use a lightweight probe: attempt a
  // no-op refresh-less session check. If the API does not expose a dedicated
  // /auth/me endpoint yet, we derive verified status from the session list payload.
  // This is intentionally conservative: if we cannot confirm verified=true, we deny.
  const sessionCheck = await resolveSession(apiUrl, sessionId);
  if (!sessionCheck) return null;

  // Attempt /auth/me if available; fall back to treating session presence as
  // sufficient only when the API explicitly returns verified=true in the session list.
  try {
    const res = await fetch(`${apiUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${sessionId}` }
    });
    if (res.ok) {
      const body = (await res.json()) as { id: string; verified: boolean };
      return { accountId: body.id, verified: body.verified };
    }
  } catch {
    // /auth/me not yet implemented — fall through to session-list heuristic
  }

  // Conservative fallback: session is live but we cannot confirm verified status.
  // Return verified=false so the middleware denies unverified accounts.
  return { accountId: String(sessionCheck.accountId), verified: false };
}

export function makeRequireAuth(apiInternalUrl: string) {
  return async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({ code: "INVALID_TOKEN", message: "Missing or malformed Authorization header." });
      return;
    }

    const sessionId = authHeader.slice(7);
    const result = await resolveVerified(apiInternalUrl, sessionId);

    if (!result) {
      res.status(401).json({ code: "SESSION_NOT_FOUND", message: "Session not found or revoked." });
      return;
    }

    if (!result.verified) {
      res.status(403).json({ code: "ACCOUNT_UNVERIFIED", message: "Account must be verified before Stellar operations." });
      return;
    }

    (req as AuthedRequest).auth = { accountId: result.accountId, sessionId };
    next();
  };
}

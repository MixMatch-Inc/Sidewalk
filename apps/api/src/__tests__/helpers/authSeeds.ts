/**
 * Auth seed helpers for local and CI testing (#391).
 *
 * Provides named test personas that map to realistic auth states.
 * Use these in tests and smoke checks instead of ad-hoc inline credentials.
 *
 * Personas:
 *   unverified  – registered but email not yet confirmed
 *   verified    – registered and email confirmed, can log in
 *   locked      – too many failed logins, account is locked
 *   resetPending – password-reset token issued, not yet completed
 */

import type { RegisterRequest } from "@sidewalk/types";

export type AuthPersona = "unverified" | "verified" | "locked" | "resetPending";

export const SEED_CREDENTIALS: Record<AuthPersona, RegisterRequest> = {
  unverified: { email: "unverified@sidewalk.test", password: "Test1234!" },
  verified: { email: "verified@sidewalk.test", password: "Test1234!" },
  locked: { email: "locked@sidewalk.test", password: "Test1234!" },
  resetPending: { email: "reset-pending@sidewalk.test", password: "Test1234!" },
};

type RegisterFn = (body: RegisterRequest) => Promise<{ verifyToken?: string; accountId?: string }>;
type VerifyFn = (token: string) => Promise<void>;
type LoginFailFn = (email: string, times: number) => Promise<void>;
type ResetRequestFn = (email: string) => Promise<{ resetToken?: string }>;

export type SeedDeps = {
  register: RegisterFn;
  verify: VerifyFn;
  loginFail: LoginFailFn;
  resetRequest: ResetRequestFn;
};

/**
 * Provision a single persona against the provided API helpers.
 * Returns whatever tokens/IDs were issued so callers can drive further flows.
 */
export async function seedPersona(
  persona: AuthPersona,
  deps: SeedDeps
): Promise<{ verifyToken?: string; resetToken?: string }> {
  const creds = SEED_CREDENTIALS[persona];

  if (persona === "unverified") {
    const { verifyToken } = await deps.register(creds);
    return { verifyToken };
  }

  if (persona === "verified") {
    const { verifyToken } = await deps.register(creds);
    if (verifyToken) await deps.verify(verifyToken);
    return {};
  }

  if (persona === "locked") {
    await deps.register(creds);
    await deps.loginFail(creds.email, 5);
    return {};
  }

  if (persona === "resetPending") {
    const { verifyToken } = await deps.register(creds);
    if (verifyToken) await deps.verify(verifyToken);
    const { resetToken } = await deps.resetRequest(creds.email);
    return { resetToken };
  }

  return {};
}

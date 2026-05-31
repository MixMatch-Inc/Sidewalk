/**
 * Auth test-account lifecycle helpers (#398).
 *
 * Thin wrappers around the app instance so tests and smoke scripts can
 * create, verify, lock, and clean up accounts without repeating HTTP
 * boilerplate. Import `app` from `../app.js` and pass it to the helpers.
 */

import type { Express } from "express";
import type {
  RegisterResponse,
  LoginResponse,
  AuthErrorResponse,
} from "@sidewalk/types";

type Http = { status: number; body: unknown };

async function post(app: Express, path: string, body: Record<string, unknown>): Promise<Http> {
  const { default: request } = await import("supertest");
  const res = await request(app).post(path).send(body);
  return { status: res.status, body: res.body };
}

export type CreatedAccount = {
  id: string;
  email: string;
  verifyToken: string;
};

/** Register a fresh account and return its verify token from the store. */
export async function createAccount(
  app: Express,
  tokenStore: { latestTokenFor(accountId: string, kind: "verify"): string | undefined },
  email: string,
  password = "Test1234!"
): Promise<CreatedAccount> {
  const { body, status } = await post(app, "/auth/register", { email, password });
  if (status !== 201) throw new Error(`Register failed (${status}): ${JSON.stringify(body)}`);
  const reg = body as RegisterResponse;
  const verifyToken = tokenStore.latestTokenFor(reg.id, "verify") ?? "";
  return { id: reg.id, email: reg.email, verifyToken };
}

/** Verify an account's email, returning the account id on success. */
export async function verifyAccount(app: Express, token: string): Promise<void> {
  const { status, body } = await post(app, "/auth/verify-email", { token });
  if (status !== 200) throw new Error(`Verify failed (${status}): ${JSON.stringify(body)}`);
}

/** Log in and return the full LoginResponse. */
export async function loginAccount(
  app: Express,
  email: string,
  password = "Test1234!"
): Promise<LoginResponse> {
  const { status, body } = await post(app, "/auth/login", { email, password });
  if (status !== 200) throw new Error(`Login failed (${status}): ${JSON.stringify(body)}`);
  return body as LoginResponse;
}

/** Trigger enough failed logins to lock the account. */
export async function lockAccount(
  app: Express,
  email: string,
  attempts = 5
): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    await post(app, "/auth/login", { email, password: "wrong-password" });
  }
}

/** Request a password-reset token and return it from the store. */
export async function requestReset(
  app: Express,
  tokenStore: { latestTokenFor(accountId: string, kind: "reset"): string | undefined },
  accountId: string,
  email: string
): Promise<string> {
  await post(app, "/auth/password-reset/request", { email });
  return tokenStore.latestTokenFor(accountId, "reset") ?? "";
}

/** Assert that a response body matches the AuthErrorResponse shape. */
export function assertAuthError(body: unknown, expectedCode?: string): AuthErrorResponse {
  const err = body as AuthErrorResponse;
  if (typeof err.code !== "string" || typeof err.message !== "string") {
    throw new Error(`Expected AuthErrorResponse, got: ${JSON.stringify(body)}`);
  }
  if (expectedCode && err.code !== expectedCode) {
    throw new Error(`Expected error code ${expectedCode}, got ${err.code}`);
  }
  return err;
}

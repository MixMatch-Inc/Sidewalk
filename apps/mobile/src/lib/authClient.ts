/**
 * Thin auth client for the Expo mobile app.
 * Keeps token storage pluggable so we can add persistence/biometrics later.
 */

import type {
  AuthErrorResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  PasswordResetCompleteRequest,
  PasswordResetCompleteResponse,
  PasswordResetRequestRequest,
  PasswordResetRequestResponse,
  RegisterRequest,
  RegisterResponse,
  SessionTokens,
  VerifyEmailRequest,
  VerifyEmailResponse,
} from "@sidewalk/types";

const UNKNOWN_ERROR: AuthErrorResponse = {
  code: "VALIDATION_ERROR",
  message: "Something went wrong. Please try again.",
};

export type AuthSuccess<T> = { ok: true; data: T };
export type AuthFailure = { ok: false; error: AuthErrorResponse };
export type AuthResult<T> = AuthSuccess<T> | AuthFailure;

export type TokenStore = {
  get(): SessionTokens | null;
  set(tokens: SessionTokens): void;
  clear(): void;
};

export const memoryTokenStore: TokenStore = (() => {
  let tokens: SessionTokens | null = null;
  return {
    get() {
      return tokens;
    },
    set(next) {
      tokens = next;
    },
    clear() {
      tokens = null;
    },
  };
})();

function baseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_URL;
  if (!raw) return null;
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function endpoint(path: string): string {
  const url = baseUrl();
  if (!url) {
    throw new Error("Missing EXPO_PUBLIC_API_URL");
  }
  return `${url}${path}`;
}

async function parseAuthError(res: Response): Promise<AuthErrorResponse> {
  try {
    const err = (await res.json()) as Partial<AuthErrorResponse>;
    if (typeof err.message === "string" && typeof err.code === "string") {
      return err as AuthErrorResponse;
    }
    return UNKNOWN_ERROR;
  } catch {
    return UNKNOWN_ERROR;
  }
}

async function authRequest<TResponse, TBody>(
  path: string,
  body: TBody
): Promise<AuthResult<TResponse>> {
  try {
    const res = await fetch(endpoint(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ok: false, error: await parseAuthError(res) };
    }

    const data = (await res.json()) as TResponse;
    return { ok: true, data };
  } catch (error) {
    if (error instanceof Error && error.message === "Missing EXPO_PUBLIC_API_URL") {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Mobile API URL is not configured. Set EXPO_PUBLIC_API_URL and try again.",
        },
      };
    }
    return { ok: false, error: UNKNOWN_ERROR };
  }
}

export function login(body: LoginRequest): Promise<AuthResult<LoginResponse>> {
  return authRequest<LoginResponse, LoginRequest>("/auth/login", body);
}

export function requestPasswordReset(
  body: PasswordResetRequestRequest
): Promise<AuthResult<PasswordResetRequestResponse>> {
  return authRequest<PasswordResetRequestResponse, PasswordResetRequestRequest>(
    "/auth/password-reset/request",
    body
  );
}

export function completePasswordReset(
  body: PasswordResetCompleteRequest
): Promise<AuthResult<PasswordResetCompleteResponse>> {
  return authRequest<PasswordResetCompleteResponse, PasswordResetCompleteRequest>(
    "/auth/password-reset/complete",
    body
  );
}

export function register(
  body: RegisterRequest
): Promise<AuthResult<RegisterResponse>> {
  return authRequest<RegisterResponse, RegisterRequest>("/auth/register", body);
}

export function verifyEmail(
  body: VerifyEmailRequest
): Promise<AuthResult<VerifyEmailResponse>> {
  return authRequest<VerifyEmailResponse, VerifyEmailRequest>(
    "/auth/verify-email",
    body
  );
}

export async function logout(accessToken: string): Promise<AuthResult<LogoutResponse>> {
  try {
    const res = await fetch(endpoint("/auth/logout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) {
      return { ok: false, error: await parseAuthError(res) };
    }
    const data = (await res.json()) as LogoutResponse;
    return { ok: true, data };
  } catch {
    return { ok: false, error: UNKNOWN_ERROR };
  }
}


// ── Registration ──────────────────────────────────────────────────────────────

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
};

// ── Login ─────────────────────────────────────────────────────────────────────

export type LoginRequest = {
  email: string;
  password: string;
};

/**
 * Minimal session data returned on successful login.
 * Transport-agnostic: the token field carries a JWT for bearer flows;
 * cookie-backed sessions can ignore it and rely on Set-Cookie instead.
 */
export type LoginResponse = {
  token: string;
  account: {
    id: string;
    email: string;
    verified: boolean;
  };
};

// ── Shared error shape ────────────────────────────────────────────────────────

export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_UNVERIFIED";

export type AuthErrorResponse = {
  code: AuthErrorCode;
  message: string;
};

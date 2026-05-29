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

// ── Session tokens ────────────────────────────────────────────────────────────

/** Opaque token pair returned on login and refresh. */
export type SessionTokens = {
  /** Opaque access token (base64url-encoded session id). */
  accessToken: string;
  /** Opaque refresh token used to rotate the session. */
  refreshToken: string;
};

export type LoginResponse = SessionTokens & {
  account: {
    id: string;
    email: string;
    verified: boolean;
  };
};

// ── Refresh ───────────────────────────────────────────────────────────────────

export type RefreshRequest = { refreshToken: string };
export type RefreshResponse = SessionTokens;

// ── Logout ────────────────────────────────────────────────────────────────────

export type LogoutResponse = { message: string };

// ── Shared error shape ────────────────────────────────────────────────────────

// ── Email verification ────────────────────────────────────────────────────────

export type VerifyEmailRequest = { token: string };
export type VerifyEmailResponse = { message: string };

// ── Password reset ────────────────────────────────────────────────────────────

export type PasswordResetRequestRequest = { email: string };
export type PasswordResetRequestResponse = { message: string };

export type PasswordResetCompleteRequest = { token: string; password: string };
export type PasswordResetCompleteResponse = { message: string };

// ── Shared error shape ────────────────────────────────────────────────────────

export type AuthErrorCode =
  | "VALIDATION_ERROR"
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_UNVERIFIED"
  | "INVALID_TOKEN"
  | "SESSION_NOT_FOUND"
  | "TOKEN_EXPIRED"
  | "RATE_LIMITED";

export type AuthErrorResponse = {
  code: AuthErrorCode;
  message: string;
};

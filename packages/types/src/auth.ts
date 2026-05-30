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
  | "ACCOUNT_LOCKED"
  | "INVALID_TOKEN"
  | "SESSION_NOT_FOUND"
  | "TOKEN_EXPIRED"
  | "RATE_LIMITED";

/**
 * Runtime-usable error code constants (#389).
 * Use these instead of raw strings so API handlers, UI mappers, and tests all
 * reference the same values and typos are caught at compile time.
 *
 * @example
 *   if (err.code === AUTH_ERROR_CODES.INVALID_CREDENTIALS) { ... }
 *   res.json({ code: AUTH_ERROR_CODES.EMAIL_TAKEN, message: "..." })
 */
export const AUTH_ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  EMAIL_TAKEN: "EMAIL_TAKEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  ACCOUNT_UNVERIFIED: "ACCOUNT_UNVERIFIED",
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  INVALID_TOKEN: "INVALID_TOKEN",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  RATE_LIMITED: "RATE_LIMITED",
} as const satisfies Record<AuthErrorCode, AuthErrorCode>;

export type AuthErrorResponse = {
  code: AuthErrorCode;
  message: string;
};

// ── Shared domain types ───────────────────────────────────────────────────────

/**
 * The public account shape shared across web, mobile, and API.
 * Contains only client-safe fields — no password hashes or internal flags.
 */
export type AuthUser = {
  id: string;
  email: string;
  verified: boolean;
};

/**
 * Client-safe session payload: the user identity plus opaque tokens.
 * This is the canonical shape clients store and pass to authenticated requests.
 */
export type AuthSessionPayload = SessionTokens & {
  user: AuthUser;
};

/**
 * Discriminated union representing the three possible auth states in any
 * client (web, mobile). Use this as the single source of truth for
 * auth-gated navigation and UI rendering.
 */
export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "unverified"; session: AuthSessionPayload }
  | { status: "signedIn"; session: AuthSessionPayload };

/**
 * Represents the first post-authentication landing decision.
 * Consumers pick between directing a new user to onboarding vs a returning
 * user to their dashboard.
 */
export type AuthLandingContext = {
  user: AuthUser;
  isNewAccount: boolean;
};

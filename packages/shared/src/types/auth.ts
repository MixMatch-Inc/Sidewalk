export interface PublicUser {
  id: string;
  email: string;
  createdAt: string;
}

/** JWT claims decoded from a signed token. */
export interface AuthClaims {
  sub: string;
  email: string;
  role: string;
  exp: number;
  iat?: number;
}

/** Scoped token claims — extends AuthClaims with permission scopes. */
export interface ScopedTokenClaims extends AuthClaims {
  scope: string[];
}

/** Resolved caller identity after JWT verification. */
export interface ApiIdentity {
  id: string;
  email: string;
  role: string;
  scopes: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export type RegisterResponse = PublicUser;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: PublicUser;
}

export interface AuthErrorResponse {
  code: string;
  message: string;
}

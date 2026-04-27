/**
 * securityConfig.ts
 * Environment-aware CORS origins, proxy trust, and security header defaults.
 * Closes #202
 */

import type { CorsOptions } from "cors";

type Env = "development" | "staging" | "production";

const ALLOWED_ORIGINS: Record<Env, string[]> = {
  development: ["http://localhost:3000", "http://localhost:8081"],
  staging: ["https://staging.sidewalk.app"],
  production: ["https://sidewalk.app", "https://www.sidewalk.app"],
};

export function corsOptions(env: Env = "development"): CorsOptions {
  return {
    origin: (origin, cb) => {
      if (!origin || ALLOWED_ORIGINS[env].includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error(`CORS: origin ${origin} not allowed in ${env}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  };
}

/** Express `trust proxy` value per environment. */
export function trustProxy(env: Env = "development"): number | boolean {
  if (env === "development") return false;
  // Trust one hop (load balancer / reverse proxy) in staging and production.
  return 1;
}

/** Helmet-compatible security header overrides. */
export function helmetOptions(env: Env = "development") {
  return {
    contentSecurityPolicy: env === "development" ? false : undefined,
    hsts: env === "production" ? { maxAge: 31_536_000, includeSubDomains: true } : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
  };
}

export function cookieDefaults(env: Env = "development") {
  return {
    httpOnly: true,
    secure: env !== "development",
    sameSite: (env === "development" ? "lax" : "strict") as "lax" | "strict",
  };
}

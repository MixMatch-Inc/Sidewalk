import { z } from 'zod';

/**
 * Auth environment matrix for preview and staging deployments (#396).
 *
 * Common misconfiguration points:
 *   ALLOWED_ORIGIN   – must match the exact preview URL (including protocol, no trailing slash)
 *   NEXT_PUBLIC_API_URL – web client must point at the correct preview API instance
 *   JWT_SECRET       – use a unique value per environment; never reuse production secrets
 *   COOKIE_DOMAIN    – must be set when API and web are on different subdomains
 *
 * Environment tiers:
 *   local    – all services on localhost; credentials can be placeholder values
 *   preview  – Vercel / Railway preview branches; each PR gets its own URL set
 *   staging  – persistent pre-production environment; mirrors production config shape
 *   production – real secrets required; STELLAR_NETWORK=mainnet
 */

export const previewAuthEnvSchema = z.object({
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // ── Auth ────────────────────────────────────────────────────────────────────
  JWT_SECRET: z.string().trim().min(16),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),

  // ── CORS / cookies ──────────────────────────────────────────────────────────
  // ALLOWED_ORIGIN must be the exact origin of the web client (no trailing slash).
  ALLOWED_ORIGIN: z.string().url(),
  // COOKIE_DOMAIN is optional; set when API and web live on different subdomains.
  COOKIE_DOMAIN: z.string().optional(),

  // ── Client URLs ─────────────────────────────────────────────────────────────
  // Used by the web client to reach the API. Must be publicly accessible in preview.
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  // Used by the mobile client.
  EXPO_PUBLIC_API_URL: z.string().url().optional(),

  // ── Email ───────────────────────────────────────────────────────────────────
  MAIL_TRANSPORT: z.enum(['log', 'smtp']).default('log'),
  MAIL_SMTP_HOST: z.string().optional(),
  MAIL_SMTP_PORT: z.coerce.number().optional(),
  MAIL_FROM: z.string().optional(),
});

export type PreviewAuthEnv = z.infer<typeof previewAuthEnvSchema>;

export function validatePreviewAuthEnv(
  env: NodeJS.ProcessEnv = process.env
): PreviewAuthEnv {
  const result = previewAuthEnvSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
      .join('; ');
    throw new Error(`Preview auth environment invalid — ${details}`);
  }
  return result.data;
}

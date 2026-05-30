import { z } from 'zod';

/**
 * Environment contract for apps/stellar-service.
 *
 * Public vs private split:
 *   - STELLAR_NETWORK / HORIZON_URL  → safe to log; used in client-facing payloads
 *   - STELLAR_SECRET_KEY             → private; never expose in API responses or logs
 *
 * Auth-sensitive variables (JWT_SECRET etc.) are shared via authEnvSchema.
 * Import validateAuthEnv from ./auth-env and call it alongside this validator
 * at stellar-service startup.
 */
export const stellarEnvSchema = z.object({
  PORT: z.coerce.number().default(4010),
  APP_ENV: z.enum(['development', 'test', 'production']).default('development'),
  STELLAR_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  HORIZON_URL: z.string().url().default('https://horizon-testnet.stellar.org'),
  STELLAR_SECRET_KEY: z.string().trim().min(1).optional(),
  API_INTERNAL_URL: z
    .string()
    .url()
    .default('http://localhost:4000'),
});

export type StellarEnv = z.infer<typeof stellarEnvSchema>;

/**
 * Validates stellar-service environment at startup.
 * Throws with actionable variable names on failure.
 */
export function validateStellarEnv(env: NodeJS.ProcessEnv = process.env): StellarEnv {
  const result = stellarEnvSchema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
      .join('; ');
    throw new Error(`[stellar-service] Environment invalid — ${details}`);
  }
  return result.data;
}

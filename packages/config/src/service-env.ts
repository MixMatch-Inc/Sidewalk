import { z } from 'zod';

/**
 * Validates process.env against a Zod schema and returns the parsed result.
 * Throws with a clear message listing all invalid variables on failure.
 *
 * @param service - Service name used in error messages (e.g. "api")
 * @param schema  - Zod object schema describing the expected env vars
 */
export function readServiceEnv<T extends z.ZodRawShape>(
  service: string,
  schema: z.ZodObject<T>
): z.infer<z.ZodObject<T>> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join('.') || 'env'}: ${i.message}`)
      .join('; ');
    throw new Error(`[${service}] Environment invalid — ${details}`);
  }
  return result.data;
}

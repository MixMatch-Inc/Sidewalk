import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1).default("file:./dev.db"),
  JWT_SECRET: z.string().min(8).default("replace-me-with-a-long-random-string"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  ALLOWED_ORIGIN: z.string().url().default("http://localhost:3000")
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

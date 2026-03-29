import { z } from 'zod';

const optionalTrimmedString = z
  .string()
  .trim()
  .min(1)
  .optional();

const apiEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGO_URI: z.string().trim().min(1).default('mongodb://localhost:27017/sidewalk'),
  JWT_SECRET: optionalTrimmedString,
  JWT_PRIVATE_KEY: optionalTrimmedString,
  JWT_PUBLIC_KEY: optionalTrimmedString,
  ACCESS_TOKEN_EXPIRES_IN: z.string().trim().min(1).default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().trim().min(1).default('30d'),
  STELLAR_SECRET_KEY: optionalTrimmedString,
  REDIS_URL: z.string().trim().url().optional(),
  RESEND_API_KEY: optionalTrimmedString,
  OTP_EMAIL_FROM: z.string().trim().min(1).default('no-reply@sidewalk.local'),
  S3_BUCKET: optionalTrimmedString,
  S3_REGION: z.string().trim().min(1).default('us-east-1'),
  S3_ENDPOINT: z.string().trim().url().optional(),
  S3_PUBLIC_BASE_URL: z.string().trim().url().optional(),
  S3_ACCESS_KEY_ID: optionalTrimmedString,
  S3_SECRET_ACCESS_KEY: optionalTrimmedString,
  ENABLE_MEDIA_WORKER: z.enum(['true', 'false']).default('true'),
  ENABLE_STELLAR_ANCHOR_WORKER: z.enum(['true', 'false']).default('true'),
});

const formatIssues = (issues: z.ZodIssue[]) =>
  issues
    .map((issue) => {
      const path = issue.path.join('.') || 'env';
      return `${path}: ${issue.message}`;
    })
    .join('; ');

const parseApiEnv = () => {
  const result = apiEnvSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(`Invalid API environment configuration: ${formatIssues(result.error.issues)}`);
  }

  return result.data;
};

export const getApiEnv = () => parseApiEnv();

export const getJwtEnv = () => {
  const env = getApiEnv();
  const hasSecret = Boolean(env.JWT_SECRET);
  const hasKeyPair = Boolean(env.JWT_PRIVATE_KEY && env.JWT_PUBLIC_KEY);

  if (!hasSecret && !hasKeyPair) {
    throw new Error(
      'JWT configuration missing. Set JWT_SECRET or JWT_PRIVATE_KEY and JWT_PUBLIC_KEY.',
    );
  }

  return env;
};

export const getStellarEnv = () => {
  const env = getApiEnv();

  if (!env.STELLAR_SECRET_KEY) {
    throw new Error('STELLAR_SECRET_KEY is required for Stellar-backed API flows.');
  }

  return {
    ...env,
    STELLAR_SECRET_KEY: env.STELLAR_SECRET_KEY,
  };
};

export const getS3Env = () => {
  const env = getApiEnv();

  if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error(
      'S3 configuration missing. Set S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.',
    );
  }

  return {
    ...env,
    S3_BUCKET: env.S3_BUCKET,
    S3_ACCESS_KEY_ID: env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: env.S3_SECRET_ACCESS_KEY,
  };
};

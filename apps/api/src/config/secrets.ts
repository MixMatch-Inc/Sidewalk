/**
 * Secret-management helpers.
 * Validates that required env vars are present and never logs their values.
 * Closes #197
 */

export type SecretKey =
  | "MONGO_URI"
  | "JWT_SECRET"
  | "STELLAR_SECRET_KEY"
  | "REDIS_URL"
  | "RESEND_API_KEY"
  | "AWS_ACCESS_KEY_ID"
  | "AWS_SECRET_ACCESS_KEY"
  | "S3_BUCKET";

const REQUIRED: SecretKey[] = ["MONGO_URI", "JWT_SECRET"];

const OPTIONAL: SecretKey[] = [
  "STELLAR_SECRET_KEY",
  "REDIS_URL",
  "RESEND_API_KEY",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "S3_BUCKET",
];

export function getSecret(key: SecretKey): string | undefined {
  return process.env[key];
}

export function requireSecret(key: SecretKey): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required secret: ${key}`);
  return val;
}

export function validateSecrets(): { missing: string[]; optional: string[] } {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  const optional = OPTIONAL.filter((k) => !process.env[k]);

  if (missing.length) {
    throw new Error(`Missing required secrets: ${missing.join(", ")}`);
  }

  if (optional.length) {
    console.warn(`[secrets] Optional secrets not set: ${optional.join(", ")}`);
  }

  return { missing, optional };
}

export function maskSecret(value: string): string {
  if (value.length <= 4) return "****";
  return `${value.slice(0, 2)}${"*".repeat(value.length - 4)}${value.slice(-2)}`;
}

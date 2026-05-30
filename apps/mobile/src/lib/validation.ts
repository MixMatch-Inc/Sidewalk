export function isValidEmail(email: string): boolean {
  // Intentionally lightweight; server still validates.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export type FieldValidation = {
  ok: boolean;
  message?: string;
};

/** @deprecated Use FieldValidation */
export type PasswordValidation = FieldValidation;

export function validatePassword(password: string): FieldValidation {
  if (!password) return { ok: false, message: "Password is required." };
  if (password.trim().length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  return { ok: true };
}

export function validatePasswordConfirm(
  password: string,
  confirm: string
): FieldValidation {
  if (!confirm) return { ok: false, message: "Please confirm your password." };
  if (password !== confirm) return { ok: false, message: "Passwords do not match." };
  return { ok: true };
}

export function validateRequiredField(
  value: string,
  label: string
): FieldValidation {
  if (!value.trim()) return { ok: false, message: `${label} is required.` };
  return { ok: true };
}

/** Returns the first failing validation message, or null if all pass. */
export function firstError(...results: FieldValidation[]): string | null {
  return results.find((r) => !r.ok)?.message ?? null;
}

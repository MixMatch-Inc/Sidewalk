export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export interface ErrorEnvelope {
  success: false;
  error: {
    code: DomainErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export function success<T>(data: T): SuccessEnvelope<T> {
  return { success: true, data };
}

export function error(
  code: DomainErrorCode,
  message: string,
  details?: Record<string, unknown>,
): ErrorEnvelope {
  return { success: false, error: { code, message, details } };
}

export function paginated<T>(
  data: T[],
  total: number,
  nextCursor?: string,
): SuccessEnvelope<{ items: T[]; total: number; nextCursor?: string }> {
  return success({ items: data, total, nextCursor });
}

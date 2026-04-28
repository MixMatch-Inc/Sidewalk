const SENSITIVE_FIELDS = ['reportBody', 'description', 'notes'];

export const sanitizePayload = (payload: Record<string, any>) => {
  const sanitized = { ...payload };

  for (const key of SENSITIVE_FIELDS) {
    if (sanitized[key]) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};
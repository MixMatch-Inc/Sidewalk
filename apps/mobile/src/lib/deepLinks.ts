export type ResetLinkContext = { token: string };
export type VerifyEmailLinkContext = { token: string };

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseResetLink(url: string): ResetLinkContext | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  const tokenParamMatch = trimmed.match(/[?&]token=([^&#]+)/i);
  if (tokenParamMatch?.[1]) {
    return { token: safeDecode(tokenParamMatch[1]) };
  }

  const pathMatch = trimmed.match(/\/reset-password\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return { token: safeDecode(pathMatch[1]) };
  }

  return null;
}

/**
 * #384 – Parse a verification deep link.
 *
 * Supported formats:
 *   sidewalk://verify-email?token=<TOKEN>
 *   sidewalk://auth/verify-email?token=<TOKEN>
 *   sidewalk://verify-email/<TOKEN>
 */
export function parseVerifyEmailLink(url: string): VerifyEmailLinkContext | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (!/verify/i.test(trimmed)) return null;

  const tokenParamMatch = trimmed.match(/[?&]token=([^&#]+)/i);
  if (tokenParamMatch?.[1]) {
    return { token: safeDecode(tokenParamMatch[1]) };
  }

  const pathMatch = trimmed.match(/\/verify-email\/([^/?#]+)/i);
  if (pathMatch?.[1]) {
    return { token: safeDecode(pathMatch[1]) };
  }

  return null;
}


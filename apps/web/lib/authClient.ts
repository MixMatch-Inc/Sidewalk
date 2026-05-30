/**
 * Thin auth client for the web app.
 * Stores tokens in sessionStorage and handles refresh + expiry.
 */

import type { SessionTokens } from "@sidewalk/types";

const ACCESS_KEY = "sw_access";
const REFRESH_KEY = "sw_refresh";

export function saveTokens(tokens: SessionTokens): void {
  sessionStorage.setItem(ACCESS_KEY, tokens.accessToken);
  sessionStorage.setItem(REFRESH_KEY, tokens.refreshToken);
}

export function clearTokens(): void {
  sessionStorage.removeItem(ACCESS_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

/**
 * Attempt a silent token refresh.
 * Returns true on success, false if the session is fully expired.
 */
export async function refreshSession(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      }
    );

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const tokens: SessionTokens = await res.json();
    saveTokens(tokens);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

/**
 * Build an Authorization header, refreshing the session if needed.
 * Returns null when the session is fully expired.
 */
export async function getAuthHeader(): Promise<Record<string, string> | null> {
  let token = getAccessToken();
  if (!token) {
    const ok = await refreshSession();
    if (!ok) return null;
    token = getAccessToken();
  }
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function logout(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      clearTokens();
      return { ok: true };
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
    });

    if (!res.ok) {
      let message = "Unable to sign out right now.";
      try {
        const data = (await res.json()) as { message?: string };
        if (typeof data.message === "string") message = data.message;
      } catch {
        // Keep fallback message.
      }
      return { ok: false, message };
    }

    clearTokens();
    return { ok: true };
  } catch {
    return { ok: false, message: "Network error. Please try again." };
  }
}

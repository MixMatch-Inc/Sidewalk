'use client';

import { getApiBaseUrl } from './api';
import { clearSession, getAccessToken, persistSession } from './auth-storage';

const refreshAccessToken = async (): Promise<string | null> => {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientType: 'web',
      deviceId: 'web-browser',
    }),
  });

  const payload = (await response.json()) as { accessToken?: string; expiresIn?: string };
  if (!response.ok || !payload.accessToken) {
    return null;
  }

  persistSession({
    accessToken: payload.accessToken,
    expiresIn: payload.expiresIn ?? '15m',
  });

  return payload.accessToken;
};

export const authenticatedJsonFetch = async <T>(
  path: string,
  init?: RequestInit,
): Promise<T> => {
  const execute = async (token: string | null) =>
    fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });

  let token = getAccessToken();
  let response = await execute(token);

  if (response.status === 401) {
    token = await refreshAccessToken();
    if (!token) {
      clearSession();
      throw new Error('Session expired. Sign in again.');
    }

    response = await execute(token);
  }

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Request failed');
  }

  return payload;
};

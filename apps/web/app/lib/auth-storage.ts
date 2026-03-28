'use client';

const ACCESS_TOKEN_KEY = 'sidewalk:access-token';
const ACCESS_TOKEN_EXPIRES_AT_KEY = 'sidewalk:access-token-expires-at';
const ROLE_KEY = 'sidewalk:role';
const EMAIL_KEY = 'sidewalk:auth-email';

type PersistedSession = {
  accessToken: string;
  expiresIn: string;
  email?: string;
  role?: string;
};

const parseExpiry = (expiresIn: string): number => {
  const trimmed = expiresIn.trim();
  if (trimmed.endsWith('m')) {
    return Number.parseInt(trimmed, 10) * 60 * 1000;
  }

  if (trimmed.endsWith('h')) {
    return Number.parseInt(trimmed, 10) * 60 * 60 * 1000;
  }

  const numeric = Number.parseInt(trimmed, 10);
  return Number.isFinite(numeric) ? numeric * 1000 : 15 * 60 * 1000;
};

export const persistSession = ({ accessToken, expiresIn, email, role }: PersistedSession) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(
    ACCESS_TOKEN_EXPIRES_AT_KEY,
    String(Date.now() + parseExpiry(expiresIn)),
  );

  if (email) {
    window.localStorage.setItem(EMAIL_KEY, email);
  }

  if (role) {
    window.localStorage.setItem(ROLE_KEY, role);
  }
};

export const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const expiresAt = Number(window.localStorage.getItem(ACCESS_TOKEN_EXPIRES_AT_KEY) ?? '0');
  if (expiresAt > Date.now()) {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  return null;
};

export const getStoredRole = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(ROLE_KEY);
};

export const clearSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_EXPIRES_AT_KEY);
  window.localStorage.removeItem(ROLE_KEY);
};

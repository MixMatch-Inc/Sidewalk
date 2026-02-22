import { Response } from 'express';

export const COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export const parseCookies = (cookieHeader?: string): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawName, ...rest] = part.trim().split('=');
    if (!rawName || rest.length === 0) {
      return acc;
    }

    acc[rawName] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
};

export const setRefreshCookie = (res: Response, refreshToken: string) => {
  res.cookie(COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth/refresh',
  });
};

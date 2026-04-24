'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  clearStoredSession,
  getDeviceId,
  persistSession,
  readStoredSession,
  type StoredSession,
} from '../lib/session-storage';

type SessionRole = 'CITIZEN' | 'AGENCY_ADMIN';

type SessionContextValue = {
  accessToken: string | null;
  refreshToken: string | null;
  email: string | null;
  role: SessionRole | null;
  deviceId: string | null;
  isHydrating: boolean;
  signIn: (session: {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    email: string;
    role: SessionRole;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

type RefreshSessionResponse = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  expiresIn: string;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const accessTokenExpiresAt = () => new Date(Date.now() + 15 * 60 * 1000).toISOString();

const toStoredSession = (
  session: StoredSession | {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    email: string;
    role: SessionRole;
  },
): StoredSession => ({
  accessToken: session.accessToken,
  accessTokenExpiresAt:
    'accessTokenExpiresAt' in session ? session.accessTokenExpiresAt : accessTokenExpiresAt(),
  refreshToken: session.refreshToken,
  refreshTokenExpiresAt: session.refreshTokenExpiresAt,
  email: session.email,
  role: session.role,
});

export function SessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<SessionRole | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const hydrateState = async (session: StoredSession) => {
    setAccessToken(session.accessToken);
    setRefreshToken(session.refreshToken);
    setEmail(session.email);
    setRole(session.role ?? 'CITIZEN');
  };

  const signOut = async () => {
    setAccessToken(null);
    setRefreshToken(null);
    setEmail(null);
    setRole(null);
    await clearStoredSession();
  };

  const signIn = async (session: {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: string;
    email: string;
    role: SessionRole;
  }) => {
    const stored = toStoredSession(session);
    await persistSession(stored);
    await hydrateState(stored);
  };

  const restoreSession = useCallback(async () => {
    const resolvedDeviceId = await getDeviceId();
    setDeviceId(resolvedDeviceId);

    const stored = await readStoredSession();
    if (!stored) {
      await signOut();
      return;
    }

    if (new Date(stored.refreshTokenExpiresAt).getTime() <= Date.now()) {
      await signOut();
      return;
    }

    try {
      const payload = await apiFetch<RefreshSessionResponse>('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: resolvedDeviceId,
          refreshToken: stored.refreshToken,
          clientType: 'mobile',
        }),
      });

      const refreshed = toStoredSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
        email: stored.email,
        role: stored.role ?? 'CITIZEN',
      });

      await persistSession(refreshed);
      await hydrateState(refreshed);
    } catch {
      await signOut();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        await restoreSession();
      } finally {
        if (!cancelled) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [restoreSession]);

  return (
    <SessionContext.Provider
      value={{
        accessToken,
        refreshToken,
        email,
        role,
        deviceId,
        isHydrating,
        signIn,
        signOut,
        restoreSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
};

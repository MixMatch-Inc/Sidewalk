'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { getApiBaseUrl } from '../lib/api';
import {
  clearSession,
  getAccessToken,
  getStoredRole,
  persistSession,
} from '../lib/auth-storage';

export function ProtectedAppShell({ children }: Readonly<{ children: ReactNode }>) {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const ensureSession = async () => {
      const accessToken = getAccessToken();
      if (accessToken) {
        if (!cancelled) {
          setRole(getStoredRole());
          setIsReady(true);
        }
        return;
      }

      try {
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
          throw new Error('refresh_failed');
        }

        persistSession({
          accessToken: payload.accessToken,
          expiresIn: payload.expiresIn ?? '15m',
        });

        if (!cancelled) {
          setRole(getStoredRole());
          setIsReady(true);
        }
      } catch {
        clearSession();
        router.replace('/auth/request-otp');
      }
    };

    void ensureSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!isReady) {
    return (
      <main className="page-shell">
        <section className="hero compact">
          <p className="eyebrow">Session</p>
          <h1>Restoring web session.</h1>
          <p className="lede">Checking for a stored access token or refresh cookie.</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Sidewalk Web</p>
          <strong>Signed in{role ? ` as ${role.toLowerCase()}` : ''}</strong>
        </div>
        <nav className="topbar-links" aria-label="Authenticated navigation">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/dashboard/reports">Reports</Link>
          <button
            className="button button-secondary"
            type="button"
            onClick={() => {
              clearSession();
              router.replace('/auth/request-otp');
            }}
          >
            Sign out
          </button>
        </nav>
      </header>
      {children}
    </>
  );
}

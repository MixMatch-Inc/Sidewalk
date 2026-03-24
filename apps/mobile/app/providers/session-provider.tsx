'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

type SessionState = {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const value = useMemo(
    () => ({
      accessToken,
      setAccessToken,
    }),
    [accessToken],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }

  return context;
};

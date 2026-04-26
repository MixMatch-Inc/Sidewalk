'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export type ApiErrorState =
  | { kind: 'none' }
  | { kind: 'auth'; message: string }
  | { kind: 'forbidden'; message: string }
  | { kind: 'validation'; message: string }
  | { kind: 'server'; message: string };

function classifyError(err: unknown): ApiErrorState {
  const message = err instanceof Error ? err.message : 'Something went wrong.';

  if (/401|session expired|sign in/i.test(message)) {
    return { kind: 'auth', message: 'Your session has expired. Redirecting to sign-in…' };
  }
  if (/403|forbidden/i.test(message)) {
    return { kind: 'forbidden', message: 'You do not have permission to do that.' };
  }
  if (/422|validation/i.test(message)) {
    return { kind: 'validation', message };
  }
  return { kind: 'server', message };
}

export function useApiError() {
  const router = useRouter();
  const [apiError, setApiError] = useState<ApiErrorState>({ kind: 'none' });

  const handleError = useCallback(
    (err: unknown) => {
      const classified = classifyError(err);
      setApiError(classified);

      if (classified.kind === 'auth') {
        setTimeout(() => router.push('/auth/request-otp'), 1500);
      }
    },
    [router],
  );

  const clearError = useCallback(() => setApiError({ kind: 'none' }), []);

  return { apiError, handleError, clearError };
}

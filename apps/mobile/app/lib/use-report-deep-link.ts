import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useSession } from '../providers/session-provider';

type DeepLinkState =
  | { status: 'loading' }
  | { status: 'ready'; reportId: string }
  | { status: 'invalid'; reason: string };

/**
 * Validates a report deep-link param and redirects unauthenticated users
 * through auth, preserving the target so they land on the right screen after sign-in.
 */
export function useReportDeepLink(rawId: string | string[] | undefined): DeepLinkState {
  const router = useRouter();
  const { accessToken, isHydrating } = useSession();
  const [state, setState] = useState<DeepLinkState>({ status: 'loading' });

  useEffect(() => {
    if (isHydrating) return;

    const reportId = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!reportId || !/^[a-zA-Z0-9_-]{1,128}$/.test(reportId)) {
      setState({ status: 'invalid', reason: 'The report link is missing or malformed.' });
      return;
    }

    if (!accessToken) {
      // Redirect to login; Expo Router will restore the deep-link after auth
      router.replace({
        pathname: '/(auth)/login',
        params: { returnTo: `/(app)/reports/${reportId}` },
      });
      return;
    }

    setState({ status: 'ready', reportId });
  }, [rawId, accessToken, isHydrating, router]);

  return state;
}

import NetInfo from '@react-native-community/netinfo';
import { useCallback, useState } from 'react';

type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'offline' }
  | { status: 'error'; message: string };

/**
 * Wraps an async fetch with pull-to-refresh support and offline detection.
 * Returns `status: 'offline'` when the device has no network, so callers can
 * show distinct copy instead of a generic server-error message.
 */
export function useRefreshableFetch<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<FetchState<T>>({ status: 'idle' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (isPullRefresh = false) => {
      if (isPullRefresh) {
        setRefreshing(true);
      } else {
        setState({ status: 'loading' });
      }

      const net = await NetInfo.fetch();
      if (!net.isConnected) {
        setState({ status: 'offline' });
        setRefreshing(false);
        return;
      }

      try {
        const data = await fetcher();
        setState({ status: 'success', data });
      } catch (err) {
        setState({
          status: 'error',
          message: err instanceof Error ? err.message : 'Something went wrong.',
        });
      } finally {
        setRefreshing(false);
      }
    },
    [fetcher],
  );

  const refresh = useCallback(() => void load(true), [load]);

  return { state, refreshing, load: () => void load(false), refresh };
}

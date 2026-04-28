'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Toast = { id: number; message: string; type: 'success' | 'error'; retry?: () => void };

let nextId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((message: string, type: Toast['type'], retry?: () => void) => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type, retry }]);
    if (type === 'success') setTimeout(() => dismiss(id), 4000);
    return id;
  }, [dismiss]);

  return { toasts, show, dismiss };
}

export function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <span>{t.message}</span>
          {t.retry && (
            <button className="toast-retry" onClick={() => { t.retry?.(); dismiss(t.id); }}>
              Retry
            </button>
          )}
          <button className="toast-close" aria-label="Dismiss" onClick={() => dismiss(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

export function useMutation<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<void>,
  options: { onSuccess?: () => void; successMsg?: string; errorMsg?: string },
) {
  const { show } = useToast();
  const [pending, setPending] = useState(false);
  const latestFn = useRef(fn);
  latestFn.current = fn;

  const mutate = useCallback(async (...args: TArgs) => {
    setPending(true);
    try {
      await latestFn.current(...args);
      if (options.successMsg) show(options.successMsg, 'success');
      options.onSuccess?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (options.errorMsg ?? 'Something went wrong');
      show(msg, 'error', () => void mutate(...args));
    } finally {
      setPending(false);
    }
  }, [options, show]);

  return { mutate, pending };
}

// Re-export a combined hook for pages that need both toasts and mutations
export function useFeedback() {
  const toast = useToast();
  return toast;
}

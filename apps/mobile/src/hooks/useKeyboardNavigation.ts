import { useEffect } from 'react';

export const useKeyboardNavigation = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        el.blur();
      }
    };

    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [ref]);
};
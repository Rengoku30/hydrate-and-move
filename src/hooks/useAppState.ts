import { useEffect, useState } from 'react';
import { AppState, DEFAULT_STATE } from '../lib/types';
import { loadState, subscribe } from '../lib/storage';

export function useAppState() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loadState()
      .then((s) => {
        if (mounted) {
          setState(s);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    const unsub = subscribe((s) => {
      if (mounted) setState(s);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  return { state, loading };
}

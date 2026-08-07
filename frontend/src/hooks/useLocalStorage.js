import { useCallback, useState } from 'react';

// Like useState, but persisted to localStorage under `key`. Reads survive a
// reload and writes are lazy + JSON-serialized, so any serializable value works.
// An SSR/private-mode failure falls back to in-memory state instead of throwing.
export default function useLocalStorage(key, initialValue) {
  const read = useCallback(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [stored, setStored] = useState(read);

  const setValue = useCallback((value) => {
    setStored((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable (private mode / quota) — keep in memory only */
      }
      return next;
    });
  }, [key]);

  return [stored, setValue];
}

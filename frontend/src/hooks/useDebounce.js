import { useEffect, useState } from 'react';

// Returns `value` only after it has been stable for `delay` ms. Handy for
// search-as-you-type, window resizing, form auto-save, etc.
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

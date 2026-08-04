import { useEffect, useState } from "react";

/**
 * Returns `value`, but updated only after it's stopped changing for
 * `delayMs`. The input itself (e.g. a TextInput bound to the raw, non-
 * debounced state) stays fully responsive; only the expensive computation
 * downstream of the debounced value is what's held back.
 */
export function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

import { useCallback, useRef, useState } from "react";

// useState for polled API data: the setter ignores a value whose JSON is
// identical to the last one set, so a poll that returns the same data (the
// common case) doesn't re-render everything that reads it. Takes plain
// values only, not updater functions.
export function useStableState<T>(initial: T): [T, (next: T) => void] {
  const [value, setValue] = useState(initial);
  const lastJSON = useRef<string | null>(null);
  const set = useCallback((next: T) => {
    const json = JSON.stringify(next);
    if (json === lastJSON.current) return;
    lastJSON.current = json;
    setValue(next);
  }, []);
  return [value, set];
}

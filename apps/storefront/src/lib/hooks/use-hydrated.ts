import { useEffect, useState } from "react";

/**
 * False during SSR and the first client render, true afterwards. Islands
 * whose output depends on browser-only state (the cart in localStorage) must
 * render the server markup first, or React reports a hydration mismatch.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * False on the server and during the first (hydrating) client render, true
 * after. Gate any UI that depends on browser-only state (localStorage,
 * fetched data) behind it, so the first client render matches the server
 * HTML. A mismatch makes React throw the server HTML away and re-render the
 * whole tree on the client (seen on the home page: announcement strip and
 * consent banner).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

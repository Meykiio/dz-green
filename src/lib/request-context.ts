/**
 * Per-request SSR values (locale, coarse geo hint).
 *
 * src/server.ts creates an AsyncLocalStorage and runs every request inside
 * it. Before this, the values lived on plain globals, so two visitors
 * rendering at the same moment could get each other's language or location.
 * The storage instance is reached through globalThis so this module stays
 * import-safe in the browser bundle (no node:async_hooks import here).
 */
export interface RequestStore {
  locale: string;
  geo: { lat: number; lng: number } | null;
}

interface StoreHolder {
  getStore(): RequestStore | undefined;
}

export function requestStore(): RequestStore | undefined {
  const holder = (globalThis as { __GA_REQUEST_STORE__?: StoreHolder }).__GA_REQUEST_STORE__;
  return holder?.getStore();
}

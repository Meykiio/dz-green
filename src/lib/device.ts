const KEY = "ga-device-secret";

/**
 * Random per-browser secret sent with every submission. The server turns it
 * into a daily-rotating HMAC device hash for rate limiting — the raw secret
 * is never stored, and the hash is unlinkable across days. This is not a
 * fingerprint: it identifies nothing beyond "the same browser, today".
 */
export function getDeviceSecret(): string {
  try {
    const existing = window.localStorage.getItem(KEY);
    if (existing && existing.length >= 10) return existing;
    const created = crypto.randomUUID();
    window.localStorage.setItem(KEY, created);
    return created;
  } catch {
    // Private mode / storage blocked: fall back to a per-session secret so the
    // form still works; rate limiting then relies on the IP layer alone.
    return crypto.randomUUID();
  }
}

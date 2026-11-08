/**
 * In-memory sliding-window limiter (per server instance).
 *
 * Cheap first line in front of the database throttle (submission_meta,
 * shared across instances). On serverless each warm instance keeps its own
 * window, so on its own it would not stop a spread-out attacker; it does
 * stop a single-client flood before any database round trip, and it keeps
 * a limit in place if a throttle insert ever fails. Pure and testable.
 */
export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  /** Records a hit for `key`; returns false when over the limit. */
  allow(key: string, now = Date.now()): boolean {
    const since = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > this.maxKeys) this.evict(since);
    return true;
  }

  private evict(since: number): void {
    for (const [k, times] of this.hits) {
      if (times.every((t) => t <= since)) this.hits.delete(k);
    }
    // Still too big: drop the oldest keys (Map keeps insertion order).
    for (const k of this.hits.keys()) {
      if (this.hits.size <= this.maxKeys) break;
      this.hits.delete(k);
    }
  }
}

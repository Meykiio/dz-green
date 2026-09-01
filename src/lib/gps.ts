/** GPS fix helpers for the location watch (unit-tested). */

export interface GpsFix {
  lat: number;
  lng: number;
  accuracy: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

/**
 * Pick the final fix from a watch session. A single "best accuracy" reading
 * can be a lucky outlier sitting tens of meters off; the median of the last
 * few good fixes is robust to that. Rule: the 3 most recent fixes at ±100 m
 * or better, median lat/lng, accuracy = the best of the three. Falls back to
 * the single best fix when fewer than 2 good readings exist.
 */
export function medianFix(fixes: GpsFix[]): GpsFix | null {
  if (fixes.length === 0) return null;
  const good = fixes.filter((f) => f.accuracy <= 100);
  if (good.length >= 2) {
    const recent = good.slice(-3);
    return {
      lat: median(recent.map((f) => f.lat)),
      lng: median(recent.map((f) => f.lng)),
      accuracy: Math.min(...recent.map((f) => f.accuracy)),
    };
  }
  return fixes.reduce((best, f) => (f.accuracy < best.accuracy ? f : best));
}

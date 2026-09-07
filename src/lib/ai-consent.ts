const KEY = "ga-ai-consent";

export type AiConsent = "accepted" | "declined" | null;

export function getAiConsent(): AiConsent {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function setAiConsent(value: "accepted" | "declined"): void {
  window.localStorage.setItem(KEY, value);
}

/** Show the banner only when no choice has been stored yet. */
export function shouldShowConsent(): boolean {
  return getAiConsent() === null;
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Privacy mode for filming (2026-08-29): sensitive data (emails, phones,
 * volunteer names) is masked by default on staff pages until the owner
 * explicitly toggles it on. Persisted in localStorage. Masked by default —
 * safer to reveal on purpose than to leak on camera.
 */

const KEY = "ga-privacy";

interface PrivacyMode {
  masked: boolean;
  toggle: () => void;
}

const PrivacyContext = createContext<PrivacyMode | null>(null);

export function PrivacyModeProvider({ children }: { children: ReactNode }) {
  const [masked, setMasked] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      return localStorage.getItem(KEY) !== "off";
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setMasked((m) => {
      const next = !m;
      try {
        localStorage.setItem(KEY, next ? "on" : "off");
      } catch {
        /* private mode */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ masked, toggle }), [masked, toggle]);
  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacyMode(): PrivacyMode {
  const ctx = useContext(PrivacyContext);
  if (!ctx) throw new Error("usePrivacyMode must be used inside PrivacyModeProvider");
  return ctx;
}

export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return `${email.slice(0, Math.min(2, at))}***@${email.slice(at + 1)}`;
}

export function maskPhone(phone: string): string {
  return `${phone.slice(0, 3)}••••••`;
}

export function maskName(name: string): string {
  return `${name.slice(0, 1)}•••`;
}

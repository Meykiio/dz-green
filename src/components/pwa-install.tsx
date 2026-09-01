import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { useI18n } from "@/i18n";

/** Chromium's install-prompt event (not in the TS DOM lib). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ga-install-dismissed";

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function inStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

/**
 * One-time install banner: Chromium gets the native prompt (via
 * beforeinstallprompt), iOS gets the Share → Add to Home Screen instructions
 * (iOS has no programmatic prompt). Hidden when already installed or
 * previously dismissed.
 */
export function PwaInstallBanner() {
  const { t } = useI18n();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (inStandaloneMode()) return;
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* private mode */
    }
    if (isIos()) {
      setVisible(true);
      return;
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode */
    }
    setVisible(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setVisible(false);
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-label={t("chrome.install.title")}
      className="fixed inset-x-3 top-16 z-40 mx-auto max-w-md rounded-2xl border border-border bg-card/95 p-3 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-plant/10 text-plant">
          <Download className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{t("chrome.install.title")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isIos() ? t("chrome.install.iosBody") : t("chrome.install.body")}
          </p>
          {!isIos() && deferred && (
            <button
              type="button"
              onClick={install}
              className="tap-target mt-2 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
            >
              {t("chrome.install.button")}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("chrome.install.dismiss")}
          className="tap-target -me-1 -mt-1 grid shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

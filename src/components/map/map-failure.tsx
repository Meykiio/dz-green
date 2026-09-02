import { useState } from "react";
import { useI18n } from "@/i18n";

export type MapFailure = "webgl2" | "lost";

/** Same probe the browser uses for any WebGL canvas — cheap and side-effect free. */
export function webgl2Available(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    const ok = gl !== null;
    if (gl && "getExtension" in gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/** Instagram/Facebook/TikTok/Twitter in-app browsers — constrained WKWebView
 *  where the GPU context gets reclaimed (user reports 2026-09-01). */
export function isInAppBrowser(): boolean {
  return /Instagram|FBAN|FBAV|TikTok|Twitter/.test(navigator.userAgent);
}

export function MapFailureOverlay({ kind }: { kind: MapFailure }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const inApp = isInAppBrowser();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      /* clipboard blocked — the instructions still help */
    }
  };

  return (
    <div
      role="alert"
      className="absolute inset-0 z-10 flex items-center justify-center bg-card/95 p-4 text-center"
    >
      <div className="max-w-sm">
        <p className="text-base font-semibold">
          {inApp
            ? t("home.mapFail.inAppTitle")
            : kind === "webgl2"
              ? t("home.mapFail.webglTitle")
              : t("home.mapFail.lostTitle")}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {inApp
            ? t("home.mapFail.inAppBody")
            : kind === "webgl2"
              ? t("home.mapFail.webglBody")
              : t("home.mapFail.lostBody")}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {inApp && (
            <button
              type="button"
              onClick={copyLink}
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
            >
              {copied ? t("home.mapFail.inAppCopied") : t("home.mapFail.inAppCopy")}
            </button>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground transition-transform active:scale-[0.97]"
          >
            {t("home.mapFail.reload")}
          </button>
        </div>
      </div>
    </div>
  );
}

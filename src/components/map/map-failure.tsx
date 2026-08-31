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

export function MapFailureOverlay({ kind }: { kind: MapFailure }) {
  const { t } = useI18n();
  return (
    <div
      role="alert"
      className="absolute inset-0 z-10 flex items-center justify-center bg-card/95 p-4 text-center"
    >
      <div className="max-w-sm">
        <p className="text-base font-semibold">
          {kind === "webgl2" ? t("home.mapFail.webglTitle") : t("home.mapFail.lostTitle")}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {kind === "webgl2" ? t("home.mapFail.webglBody") : t("home.mapFail.lostBody")}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground transition-transform active:scale-[0.97]"
        >
          {t("home.mapFail.reload")}
        </button>
      </div>
    </div>
  );
}

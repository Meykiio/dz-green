import { useEffect, useRef, useState } from "react";
import { Link2, Loader2 } from "lucide-react";

import { useI18n } from "@/i18n";
import { isShortMapsLink, parseGoogleMapsLink } from "@/lib/maps-link";
import { resolveMapsLink } from "@/lib/maps.functions";

/**
 * The paste-a-Google-Maps-link fallback (extracted from LocationField,
 * 2026-09-01): direct coordinates parse client-side; short links resolve
 * server-side (SSRF-allowlisted). Used when GPS fails or the pin is wrong.
 */
export function MapsLinkField({ onLocation }: { onLocation: (lat: number, lng: number) => void }) {
  const { t } = useI18n();
  const [mapsLink, setMapsLink] = useState("");
  const [linkState, setLinkState] = useState<"idle" | "busy" | "ok" | "bad">("idle");
  // Typing a short link used to hit the server on every keystroke once it
  // matched the pattern, and a slow early answer could overwrite a later
  // one. Debounce, and drop answers for text that has since changed.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef("");
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function applyMapsLink(value: string) {
    setMapsLink(value);
    latestRef.current = value;
    if (timerRef.current) clearTimeout(timerRef.current);
    const direct = parseGoogleMapsLink(value);
    if (direct) {
      onLocation(direct.lat, direct.lng);
      setLinkState("ok");
      return;
    }
    if (isShortMapsLink(value)) {
      setLinkState("busy");
      timerRef.current = setTimeout(() => void resolveShort(value), 400);
      return;
    }
    setLinkState(value.trim() ? "bad" : "idle");
  }

  async function resolveShort(value: string) {
    try {
      const resolved = await resolveMapsLink({ data: { url: value.trim() } });
      if (latestRef.current !== value) return;
      if (resolved) {
        onLocation(resolved.lat, resolved.lng);
        setLinkState("ok");
      } else {
        setLinkState("bad");
      }
    } catch {
      if (latestRef.current === value) setLinkState("bad");
    }
  }

  return (
    <div className="mt-2.5">
      <label className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring">
        <Link2 className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={mapsLink}
          onChange={(e) => applyMapsLink(e.target.value)}
          placeholder={t("forms.location.pasteLink")}
          inputMode="url"
          className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
        />
        {linkState === "busy" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
      </label>
      {linkState === "ok" && (
        <p className="mt-1 text-xs text-plant">{t("forms.location.linkOk")}</p>
      )}
      {linkState === "bad" && <p className="mt-1 text-xs text-fire">{t("forms.location.linkError")}</p>}
    </div>
  );
}

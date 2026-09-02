import { useState } from "react";
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

  async function applyMapsLink(value: string) {
    setMapsLink(value);
    const direct = parseGoogleMapsLink(value);
    if (direct) {
      onLocation(direct.lat, direct.lng);
      setLinkState("ok");
      return;
    }
    if (isShortMapsLink(value)) {
      setLinkState("busy");
      try {
        const resolved = await resolveMapsLink({ data: { url: value.trim() } });
        if (resolved) {
          onLocation(resolved.lat, resolved.lng);
          setLinkState("ok");
        } else {
          setLinkState("bad");
        }
      } catch {
        setLinkState("bad");
      }
      return;
    }
    setLinkState(value.trim() ? "bad" : "idle");
  }

  return (
    <div className="mt-2.5">
      <label className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring">
        <Link2 className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={mapsLink}
          onChange={(e) => void applyMapsLink(e.target.value)}
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

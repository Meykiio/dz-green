import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Info, PartyPopper, TriangleAlert } from "lucide-react";

import { useI18n } from "@/i18n";
import { announcementQuery, localizedAnnouncement } from "@/lib/data";

/** Admin-picked palette: bg + text, contrast-safe by construction. */
const COLOR_STYLE = {
  ink: "bg-foreground text-background",
  plant: "bg-plant text-white",
  care: "bg-care text-white",
  fire: "bg-fire text-white",
  amber: "bg-amber-500 text-white",
} as const;

const ICON_TONE = {
  info: "opacity-80",
  success: "opacity-80",
  warning: "opacity-80",
} as const;

/**
 * Site-wide announcement strip (admin-controlled): a solid marquee ABOVE the
 * top bar, in the admin-picked color, showing the AR or EN text per the
 * visitor's locale. The pattern is the standard bulletproof one: the text
 * unit repeats until ONE copy is at least as wide as the window, then two
 * copies scroll 0 → -50% in a seamless loop — so the strip is never empty at
 * any text length or window size (the short-text-on-desktop gap, 2026-09-01).
 * The track is ALWAYS dir=ltr (an RTL track blanks out at -50%). Travel: EN
 * right→left, AR left→right. Pauses on hover, off for reduced-motion.
 */
export function AnnouncementBanner() {
  const { isRtl, locale } = useI18n();
  const announcement = useQuery(announcementQuery);
  // Hooks BEFORE any early return (React #310 — the empty-strip crash).
  const probeRef = useRef<HTMLSpanElement>(null);
  const [repeat, setRepeat] = useState(1);
  const list = announcement.data ?? [];
  const newest = list[0];
  const unit =
    list
      .map((a) => {
        const { title, body } = localizedAnnouncement(a, locale);
        return `${title} — ${body}`;
      })
      .join("   •   ") + "   •   ";

  // One copy must be at least as wide as the window — repeat the unit.
  useEffect(() => {
    const probe = probeRef.current;
    if (!probe || !newest) return;
    const w = probe.getBoundingClientRect().width;
    if (w > 0) setRepeat(Math.max(1, Math.ceil(window.innerWidth / w)));
  }, [unit, newest]);

  if (!newest) return null;
  const Icon =
    newest.kind === "success" ? PartyPopper : newest.kind === "warning" ? TriangleAlert : Info;
  const copy = unit.repeat(repeat);

  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-50 flex h-9 items-center overflow-hidden ${COLOR_STYLE[newest.color] ?? COLOR_STYLE.ink}`}
    >
      <span className={`grid h-full w-9 shrink-0 place-items-center ${ICON_TONE[newest.kind]}`}>
        <Icon className="size-4" />
      </span>
      <div className="group relative flex-1 overflow-hidden">
        {/* Hidden probe: measures one unit's width. */}
        <span ref={probeRef} className="invisible absolute whitespace-nowrap text-sm font-medium" aria-hidden>
          {unit}
        </span>
        <div
          className={`ga-marquee flex w-max items-center whitespace-nowrap text-sm font-medium group-hover:[animation-play-state:paused] ${
            isRtl ? "ga-marquee-rtl" : ""
          }`}
          style={{ animationDuration: `${newest.speed_seconds}s` }}
          dir="ltr"
        >
          <span className="whitespace-nowrap">{copy}</span>
          <span className="whitespace-nowrap" aria-hidden>
            {copy}
          </span>
        </div>
      </div>
    </div>
  );
}

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
 * visitor's locale. Text travels in the reading direction, loops seamlessly,
 * pauses on hover, off for reduced-motion. The chrome yields to it.
 */
export function AnnouncementBanner() {
  const { isRtl, locale } = useI18n();
  const announcement = useQuery(announcementQuery);
  const list = announcement.data ?? [];
  if (list.length === 0) return null;
  // Several can be live at once: they scroll as one continuous marquee.
  // Strip color/icon/speed come from the newest live announcement.
  const newest = list[0]!;
  const Icon =
    newest.kind === "success" ? PartyPopper : newest.kind === "warning" ? TriangleAlert : Info;
  const text = list
    .map((a) => {
      const { title, body } = localizedAnnouncement(a, locale);
      return `${title} — ${body}`;
    })
    .join("   •   ");

  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-50 flex h-9 items-center overflow-hidden ${COLOR_STYLE[newest.color] ?? COLOR_STYLE.ink}`}
    >
      <span className={`grid h-full w-9 shrink-0 place-items-center ${ICON_TONE[newest.kind]}`}>
        <Icon className="size-4" />
      </span>
      <div className="group relative flex-1 overflow-hidden">
        {/* The track stays dir=ltr so the marquee geometry is identical in
            both locales (an RTL track blanks out at -50% — the empty-strip
            bug). Arabic text shapes correctly inside the spans regardless. */}
        <div
          className={`ga-marquee flex w-max items-center whitespace-nowrap text-sm font-medium group-hover:[animation-play-state:paused] ${
            isRtl ? "ga-marquee-rtl" : ""
          }`}
          style={{ animationDuration: `${newest.speed_seconds}s` }}
          dir="ltr"
        >
          {/* Two copies for a seamless loop */}
          <span className="pe-16">{text}</span>
          <span className="pe-16" aria-hidden>
            {text}
          </span>
        </div>
      </div>
    </div>
  );
}

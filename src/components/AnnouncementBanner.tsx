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
  const a = announcement.data;
  if (!a) return null;
  const Icon = a.kind === "success" ? PartyPopper : a.kind === "warning" ? TriangleAlert : Info;
  const { title, body } = localizedAnnouncement(a, locale);
  const text = `${title} — ${body}`;

  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-50 flex h-9 items-center overflow-hidden ${COLOR_STYLE[a.color] ?? COLOR_STYLE.ink}`}
    >
      <span className={`grid h-full w-9 shrink-0 place-items-center ${ICON_TONE[a.kind]}`}>
        <Icon className="size-4" />
      </span>
      <div className="group relative flex-1 overflow-hidden" dir={isRtl ? "rtl" : "ltr"}>
        <div
          className="ga-marquee flex w-max items-center whitespace-nowrap text-sm font-medium group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${a.speed_seconds}s` }}
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

import { Flame, Sprout } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Photo with a Canopy fallback: when a photo is missing or its storage
 * object 404s, we never render the browser's broken-image icon — a tinted
 * block with a sprout (plantings) or flame (fires) icon takes its place.
 * The broken state resets when the src changes (detail panel reuses one
 * instance across features).
 */
export function PhotoThumb({
  src,
  alt,
  tone = "plant",
  className,
  iconClassName = "size-6",
}: {
  src: string | null | undefined;
  alt: string;
  tone?: "plant" | "fire";
  className?: string;
  iconClassName?: string;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  if (!src || broken) {
    return (
      <span
        aria-hidden
        className={`grid shrink-0 place-items-center ${
          tone === "fire" ? "bg-fire/15 text-fire" : "bg-plant/15 text-plant"
        } ${className ?? ""}`}
      >
        {tone === "fire" ? <Flame className={iconClassName} /> : <Sprout className={iconClassName} />}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBroken(true)}
      className={`object-cover ${className ?? ""}`}
    />
  );
}

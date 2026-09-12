import type { ReactNode } from "react";

type Tone = "plant" | "care" | "fire" | "muted";

const TONES: Record<Tone, string> = {
  plant: "border-plant/50 bg-plant/15 text-plant",
  care: "border-care/50 bg-care/15 text-care",
  fire: "border-fire/50 bg-fire/15 text-fire",
  muted: "border-border bg-card text-muted-foreground",
};

/** Status badge (Canopy chip: 4px radius, 13px/600). */
export function StatusBadge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-sm border px-2.5 py-0.5 text-[13px] font-semibold leading-4 tracking-[0.02em] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

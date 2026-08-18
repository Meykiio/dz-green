import type { ReactNode } from "react";

type Tone = "plant" | "care" | "fire" | "muted";

const TONES: Record<Tone, string> = {
  plant: "border-plant/50 bg-plant/15 text-plant",
  care: "border-care/50 bg-care/15 text-care",
  fire: "border-fire/50 bg-fire/15 text-fire",
  muted: "border-border bg-card text-muted-foreground",
};

/** Pill status badge (13px/600, pill, 4px 10px padding). */
export function StatusBadge({ tone = "muted", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[13px] font-semibold leading-4 ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

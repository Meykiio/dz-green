export function Chip({
  active,
  tone,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  tone: "plant" | "care" | "fire" | "hotspot" | "risk";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  // Canopy chip tones (SSOT §CHIPS & TAGS): green = active/approved, wadi
  // blue = category, sand = info/satellite, wildfire amber = fire only,
  // terracotta = supporting (risk layer).
  const on =
    tone === "plant"
      ? "border-plant/50 bg-plant/15 text-plant"
      : tone === "care"
        ? "border-care/50 bg-care/15 text-care"
        : tone === "fire"
          ? "border-fire/50 bg-fire/15 text-fire"
          : tone === "risk"
            ? "border-terracotta/50 bg-terracotta/10 text-terracotta"
            : "border-sand/50 bg-sand/10 text-sand";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tap-target inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs font-semibold tracking-[0.04em] transition-[color,background-color,border-color,transform] duration-200 ease-[var(--ease-out)] active:scale-[0.97] ${
        active ? on : "border-border bg-card text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

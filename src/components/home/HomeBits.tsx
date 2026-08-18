export function Chip({
  active,
  tone,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  tone: "plant" | "care" | "fire";
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  const on =
    tone === "plant"
      ? "border-plant/50 bg-plant/15 text-plant"
      : tone === "care"
        ? "border-care/50 bg-care/15 text-care"
        : "border-fire/50 bg-fire/15 text-fire";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`tap-target inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97] ${
        active ? on : "border-border bg-card text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

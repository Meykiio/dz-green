import { List, Map as MapIcon, Trophy } from "lucide-react";

export type HomeView = "map" | "list" | "board";

const OPTIONS: { value: HomeView; label: string; icon: typeof MapIcon }[] = [
  { value: "map", label: "Map", icon: MapIcon },
  { value: "list", label: "List", icon: List },
  { value: "board", label: "Board", icon: Trophy },
];

/** Map / List / Leaderboard switch — floats top-right over the home view. */
export function ViewToggle({
  view,
  onChange,
}: {
  view: HomeView;
  onChange: (view: HomeView) => void;
}) {
  return (
    <div className="flex rounded-full border border-border bg-card/90 p-0.5 text-xs font-medium backdrop-blur">
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-pressed={view === value}
          aria-label={value === "board" ? "Leaderboard" : label}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition-colors ${
            view === value ? "bg-accent text-foreground" : "text-muted-foreground"
          }`}
        >
          <Icon className="size-3.5" /> {label}
        </button>
      ))}
    </div>
  );
}

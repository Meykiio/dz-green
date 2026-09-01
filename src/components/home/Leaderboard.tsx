import { Link } from "@tanstack/react-router";
import { Sprout, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@/i18n";
import type { Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

type Period = "month" | "all";

/**
 * The wilaya race — approved plantings summed per wilaya, computed from the
 * already-loaded sites. Two views (owner request 2026-09-01): "This month"
 * (the race — every wilaya gets a fresh shot on the 1st) and "All time"
 * (the national record). The race stays the default: all-time calcifies,
 * monthly keeps smaller wilayas in the game.
 */
export function Leaderboard({ sites }: { sites: Site[] }) {
  const { t, count } = useI18n();
  const [period, setPeriod] = useState<Period>("month");

  const ranked = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const totals = new Map<string, number>();
    for (const site of sites) {
      if (period === "month" && new Date(site.created_at) < monthStart) continue;
      totals.set(site.wilaya_code, (totals.get(site.wilaya_code) ?? 0) + site.tree_count);
    }
    return [...totals.entries()].sort((a, b) => b[1] - a[1]);
  }, [sites, period]);

  const toggle = (
    <div className="mb-4 flex justify-center gap-1.5" role="group" aria-label={t("home.board.periodAria")}>
      {(["month", "all"] as const).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setPeriod(p)}
          aria-pressed={period === p}
          className={`tap-target rounded-full border px-4 py-1.5 text-xs font-semibold transition-all active:scale-[0.97] ${
            period === p
              ? "border-plant/50 bg-plant/15 text-plant"
              : "border-border bg-card text-muted-foreground"
          }`}
        >
          {p === "month" ? t("home.board.periodMonth") : t("home.board.periodAll")}
        </button>
      ))}
    </div>
  );

  if (ranked.length === 0) {
    return (
      <div>
        {toggle}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Trophy className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 font-semibold">{t("home.board.empty")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("home.board.emptyCta")}</p>
          <Link
            to="/plant"
            className="tap-target mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Sprout className="size-5" /> {t("home.cta.plant")}
          </Link>
        </div>
      </div>
    );
  }

  const [first, ...rest] = ranked;
  const total = ranked.reduce((sum, [, c]) => sum + c, 0);
  const max = first![1];

  return (
    <div className="space-y-4">
      {toggle}
      <div className="text-center">
        <h2 className="display-hero text-2xl">{t("home.board.heading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {count(total, "tree")}{" "}
          {t(period === "month" ? "home.board.subtitle" : "home.board.subtitleAll", {
            wilayas: count(ranked.length, "wilaya"),
          })}
        </p>
      </div>

      <div className="rounded-2xl border border-plant/40 bg-plant/10 p-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-plant">
          {t("home.board.leading")}
        </p>
        <p className="mt-1 text-xl font-bold">{wilayaName(first![0])}</p>
        <p className="text-3xl font-black tabular-nums text-plant">{first![1]}</p>
        <p className="text-xs text-muted-foreground">
          {count(first![1], "tree")}{" "}
          {period === "month" ? t("home.board.thisMonth") : t("home.board.allTime")}
        </p>
      </div>

      {rest.length > 0 && (
        <ul className="space-y-2">
          {rest.map(([code, c], index) => (
            <li
              key={code}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
                {index + 2}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{wilayaName(code)}</span>
              <span
                className="h-1.5 shrink-0 rounded-full bg-plant/60"
                style={{ width: `${Math.max(8, (c / max) * 80)}px` }}
              />
              <span className="shrink-0 text-sm font-semibold tabular-nums">{c}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

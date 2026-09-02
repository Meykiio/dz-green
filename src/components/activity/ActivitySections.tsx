import { Link } from "@tanstack/react-router";
import { Droplets, Flame, Sprout } from "lucide-react";

import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/button";
import type { CareLog, FireReport, Site } from "@/lib/types";
import { wilayaName } from "@/lib/wilayas";

const SITE_STATUS_KEY: Record<string, "pending" | "approved" | "rejected"> = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
};

const STATUTS_TONE: Record<string, string> = {
  pending: "text-amber-400",
  approved: "text-plant",
  rejected: "text-fire",
  active: "text-fire",
  resolved: "text-care",
  false_alarm: "text-muted-foreground",
};

const CARE_ACTION_KEY: Record<string, "watered" | "checked" | "needsAttention" | "update"> = {
  watered: "watered",
  checked: "checked",
  needs_attention: "needsAttention",
  other: "update",
};

/**
 * The three "my activity" sections (plantings, care, fires) — extracted from
 * the activity route, 2026-09-01. Data fetching stays in the route.
 */
export function ActivitySections({
  sites,
  care,
  fires,
}: {
  sites: Site[];
  care: CareLog[];
  fires: FireReport[];
}) {
  const { t, count, formatDateShort } = useI18n();
  return (
    <div className="mt-8 space-y-10">
      <section>
        <SectionHeader
          icon={<Sprout className="size-4 text-plant" />}
          title={t("moderation.act.section.plantings")}
          count={sites.length}
        />
        {sites.length === 0 ? (
          <Empty
            text={t("moderation.act.empty.plantings")}
            cta={{ to: "/plant", label: t("moderation.act.cta.plant") }}
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {sites.map((s) => {
              const stKey = SITE_STATUS_KEY[s.status] ?? s.status;
              const stLabel = stKey ? t(`moderation.act.status.${stKey}`) || s.status : s.status;
              return (
                <li key={s.id} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">
                      {count(s.tree_count, "tree")}
                      {s.species ? ` · ${s.species}` : ""} ·{" "}
                      {t("moderation.act.inWilaya", { wilaya: wilayaName(s.wilaya_code) })}
                    </p>
                    <span className={`text-xs font-semibold ${STATUTS_TONE[s.status] ?? ""}`}>
                      {stLabel}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("home.list.planted", { date: formatDateShort(s.planted_date) })}
                    {s.location_approximate ? ` · ${t("home.list.wilayaLevel")}` : ""}
                    {s.commune ? ` · ${s.commune}` : ""}
                  </p>
                  {s.status === "rejected" && s.moderator_notes && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {t("moderation.act.note", { note: s.moderator_notes })}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader
          icon={<Droplets className="size-4 text-care" />}
          title={t("moderation.act.section.care")}
          count={care.length}
        />
        {care.length === 0 ? (
          <Empty
            text={t("moderation.act.empty.care")}
            cta={{ to: "/care", label: t("moderation.act.cta.care") }}
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {care.map((l) => (
              <li key={l.id} className="rounded-lg border border-border bg-card px-4 py-3">
                <p className="text-sm font-medium">
                  {t(`moderation.act.care.${CARE_ACTION_KEY[l.action] ?? "other"}`)}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDateShort(l.logged_date)}
                  {l.notes ? ` · ${l.notes}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionHeader
          icon={<Flame className="size-4 text-fire" />}
          title={t("moderation.act.section.fires")}
          count={fires.length}
        />
        {fires.length === 0 ? (
          <Empty
            text={t("moderation.act.empty.fires")}
            cta={{ to: "/fire", label: t("moderation.act.cta.fire") }}
          />
        ) : (
          <ul className="mt-3 space-y-2">
            {fires.map((f) => (
              <li key={f.id} className="rounded-lg border border-border bg-card px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    {wilayaName(f.wilaya_code)}
                    {f.severity
                      ? ` · ${f.severity === "large" ? t("moderation.triage.large") : t("moderation.triage.small")}`
                      : ""}
                  </p>
                  <span className={`text-xs font-semibold ${STATUTS_TONE[f.status] ?? ""}`}>
                    {t(`moderation.triage.badge.${f.status === "false_alarm" ? "falseAlarm" : f.status}`)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("home.list.reported", { date: formatDateShort(f.created_at) })}
                  {f.location_approximate ? ` · ${t("home.list.wilayaLevel")}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-lg font-semibold">{title}</h2>
      <span className="text-sm text-muted-foreground">({count})</span>
    </div>
  );
}

function Empty({ text, cta }: { text: string; cta: { to: string; label: string } }) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-4">
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link to={cta.to}>
        <Button size="sm" variant="secondary">
          {cta.label}
        </Button>
      </Link>
    </div>
  );
}

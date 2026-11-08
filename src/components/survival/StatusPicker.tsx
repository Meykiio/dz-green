import { useI18n } from "@/i18n";
import { SURVIVAL_STATUSES, type SurvivalStatus } from "@/lib/survival";

/** Six-way status choice for a survival check (radio-group semantics). */
export function StatusPicker({
  value,
  onChange,
}: {
  value: SurvivalStatus;
  onChange: (status: SurvivalStatus) => void;
}) {
  const { t } = useI18n();
  return (
    <fieldset>
      <legend className="eyebrow">{t("survival.statusLabel")}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup">
        {SURVIVAL_STATUSES.map((s) => {
          const active = value === s;
          const good = s === "alive";
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(s)}
              className={`tap-target rounded-lg border px-3 py-2 text-sm font-medium ${
                active
                  ? good
                    ? "border-plant/60 bg-plant/15 text-plant"
                    : "border-fire/50 bg-fire/10 text-fire"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {t(`survival.status.${s}`)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

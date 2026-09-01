import { useState } from "react";

import { useI18n } from "@/i18n";
import { COMMUNES_BY_WILAYA } from "@/data/communes";

const OTHER = "__other__";

interface Props {
  /** "" until a wilaya is chosen. */
  wilaya: string;
  /** The stored commune (canonical Latin name, or free text from "other"). */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Commune as a dropdown (1,541 communes, Journal Officiel dataset) instead of
 * free text — no more typos or mixed-language values. Disabled until a
 * wilaya is chosen; "Other" keeps a free-text escape hatch for gaps.
 * Stored value is the canonical Latin name for uniform data.
 */
export function CommuneField({ wilaya, value, onChange }: Props) {
  const { t, locale } = useI18n();
  const [otherMode, setOtherMode] = useState(false);
  const communes = COMMUNES_BY_WILAYA[wilaya] ?? [];
  const inList = communes.some((c) => c.latin === value);
  const selectValue = otherMode || (value !== "" && !inList) ? OTHER : value;

  return (
    <span className="block">
      <span className="eyebrow">{t("forms.location.commune")}</span>
      <select
        value={selectValue}
        disabled={!wilaya}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setOtherMode(true);
            onChange("");
          } else {
            setOtherMode(false);
            onChange(e.target.value);
          }
        }}
        className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base disabled:opacity-60"
      >
        <option value="">{t("forms.location.communeChoose")}</option>
        {communes.map((c) => (
          <option key={c.latin} value={c.latin}>
            {locale === "ar" ? c.ar : c.latin}
          </option>
        ))}
        <option value={OTHER}>{t("forms.location.communeOther")}</option>
      </select>
      {selectValue === OTHER && (
        <input
          value={value}
          maxLength={120}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("forms.location.communeOtherPlaceholder")}
          className="tap-target mt-2 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
        />
      )}
    </span>
  );
}

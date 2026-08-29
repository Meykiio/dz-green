import { Flame, Sprout, XCircle } from "lucide-react";

import { SectionTabs } from "@/components/SectionTabs";
import { useI18n } from "@/i18n";

export type Section = "queue" | "fires" | "rejected";

interface Props {
  section: Section;
  onSelect: (s: Section) => void;
  counts: Record<Section, number>;
}

/** Section switcher for the moderation dashboard — segmented tabs, no second sidebar. */
export function ModTabs({ section, onSelect, counts }: Props) {
  const { t } = useI18n();
  return (
    <SectionTabs
      ariaLabel={t("moderation.tabs.aria")}
      active={section}
      onSelect={onSelect}
      tabs={[
        { id: "queue", label: t("moderation.tabs.pending"), icon: Sprout, count: counts.queue },
        { id: "fires", label: t("moderation.tabs.fires"), icon: Flame, count: counts.fires },
        { id: "rejected", label: t("moderation.tabs.rejected"), icon: XCircle, count: counts.rejected },
      ]}
    />
  );
}

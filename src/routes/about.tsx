import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Map as MapIcon, Phone, ShieldCheck, Sprout } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ssrT, useI18n } from "@/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: ssrT("meta.aboutTitle") },
      { name: "description", content: ssrT("meta.aboutDesc") },
      { property: "og:title", content: ssrT("meta.aboutTitle") },
      { property: "og:description", content: ssrT("meta.aboutDesc") },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t, isRtl } = useI18n();
  const Arrow = isRtl ? ArrowLeft : ArrowRight;
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">{t("info.about.eyebrow")}</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">{t("info.about.hero")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("info.about.lead")}</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span>
              <span className="font-semibold">{t("info.about.flow.youReport")}</span>
              {t("info.about.flow.youReportBody")}
            </span>
            <Arrow className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-semibold">{t("info.about.flow.review")}</span>
              {t("info.about.flow.reviewBody")}
            </span>
            <Arrow className="size-3.5 shrink-0 text-muted-foreground" />
            <span>
              <span className="font-semibold">{t("info.about.flow.map")}</span>
              {t("info.about.flow.mapBody")}
            </span>
          </p>
        </div>

        <div className="mt-10 space-y-10">
          <Section
            icon={<Sprout className="size-5 text-plant" />}
            title={t("info.about.independent.title")}
          >
            {t("info.about.independent.body")}
          </Section>

          <Section
            icon={<ShieldCheck className="size-5 text-plant" />}
            title={t("info.about.reviewed.title")}
          >
            {t("info.about.reviewed.body")}
          </Section>

          <Section
            icon={<Arrow className="size-5 text-care" />}
            title={t("info.about.immediate.title")}
          >
            {t("info.about.immediate.body")}
          </Section>

          <div className="rounded-2xl border border-fire/30 bg-fire/5 p-5">
            <p className="flex items-center gap-2 font-semibold text-fire">
              <Phone className="size-4" /> {t("info.about.notEmergency.title")}
            </p>
            <p className="mt-2 text-sm">{t("info.about.notEmergency.body")}</p>
          </div>

          <Section
            icon={<ShieldCheck className="size-5 text-muted-foreground" />}
            title={t("info.about.privacy.title")}
          >
            {t("info.about.privacy.body")}
          </Section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/">
              <MapIcon className="size-4" /> {t("info.about.back")}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/plant">
              <Sprout className="size-4" /> {t("info.about.plantCta")}
            </Link>
          </Button>
        </div>
      </article>
    </AppShell>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </h2>
      <p className="mt-2 leading-relaxed text-muted-foreground">{children}</p>
    </section>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Map as MapIcon, Phone, ShieldCheck, Sprout } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

const TITLE = "About Green Algeria — a community map, not an emergency service";
const DESCRIPTION =
  "How Green Algeria works: open planting records reviewed before publishing, immediate care logs and fire reports, run by the community for the whole country.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">{t.about.eyebrow}</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">{t.about.headline}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t.about.lead}</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span>
              <span className="font-semibold">{t.about.flowReportStrong}</span> {t.about.flowReport}
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" />
            <span>
              <span className="font-semibold">{t.about.flowReviewStrong}</span> {t.about.flowReview}
            </span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" />
            <span>
              <span className="font-semibold">{t.about.flowPublicStrong}</span> {t.about.flowPublic}
            </span>
          </p>
        </div>

        <div className="mt-10 space-y-10">
          <Section icon={<Sprout className="size-5 text-plant" />} title={t.about.independentTitle}>
            {t.about.independentBody}
          </Section>

          <Section
            icon={<ShieldCheck className="size-5 text-plant" />}
            title={t.about.reviewedTitle}
          >
            {t.about.reviewedBody}
          </Section>

          <Section
            icon={<ArrowRight className="size-5 text-care rtl:-scale-x-100" />}
            title={t.about.immediateTitle}
          >
            {t.about.immediateBody}
          </Section>

          <div className="rounded-2xl border border-fire/30 bg-fire/5 p-5">
            <p className="flex items-center gap-2 font-semibold text-fire">
              <Phone className="size-4" /> {t.about.notEmergencyTitle}
            </p>
            <p className="mt-2 text-sm">{t.about.notEmergencyBody}</p>
          </div>

          <Section
            icon={<ShieldCheck className="size-5 text-muted-foreground" />}
            title={t.about.privacyTitle}
          >
            {t.about.privacyBody}
          </Section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/">
              <MapIcon className="size-4" /> {t.about.backToMap}
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/plant">
              <Sprout className="size-4" /> {t.about.plantATree}
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

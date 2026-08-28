import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, HandHeart, ShieldAlert, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ssrT, useI18n } from "@/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: ssrT("meta.termsTitle") },
      { name: "description", content: ssrT("meta.termsDesc") },
      { property: "og:title", content: ssrT("meta.termsTitle") },
      { property: "og:description", content: ssrT("meta.termsDesc") },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">{t("info.terms.eyebrow")}</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">{t("info.terms.hero")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("info.terms.lead")}</p>

        <div className="mt-10 space-y-10">
          <Section icon={<HandHeart className="size-5 text-plant" />} title={t("info.terms.honest.title")}>
            {t("info.terms.honest.body")}
          </Section>

          <Section
            icon={<ShieldCheck className="size-5 text-plant" />}
            title={t("info.terms.moderation.title")}
          >
            {t("info.terms.moderation.body")}
          </Section>

          <Section icon={<Flame className="size-5 text-fire" />} title={t("info.terms.emergency.title")}>
            {t("info.terms.emergency.emergencyLead")}{" "}
            <span className="font-semibold">{t("info.terms.emergency.emergencyCall")}</span>{" "}
            {t("info.terms.emergency.emergencyTail")}
          </Section>

          <Section
            icon={<ShieldAlert className="size-5 text-muted-foreground" />}
            title={t("info.terms.warranty.title")}
          >
            {t("info.terms.warranty.body")}
          </Section>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          {t("info.terms.issues")}{" "}
          <a
            href="https://github.com/Meykiio/dz-green/issues"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            GitHub
          </a>
          .{" "}
          <Link to="/privacy" className="underline">
            {t("info.terms.privacyLink")}
          </Link>
          .
        </p>
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
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

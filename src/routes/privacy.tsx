import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Scale, Server, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { ssrT, useI18n } from "@/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: ssrT("meta.privacyTitle") },
      { name: "description", content: ssrT("meta.privacyDesc") },
      { property: "og:title", content: ssrT("meta.privacyTitle") },
      { property: "og:description", content: ssrT("meta.privacyDesc") },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useI18n();
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">{t("info.privacy.eyebrow")}</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">{t("info.privacy.hero")}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("info.privacy.lead")}</p>

        <div className="mt-10 space-y-10">
          <Section icon={<Eye className="size-5 text-plant" />} title={t("info.privacy.public.title")}>
            {t("info.privacy.public.body")}
          </Section>

          <Section icon={<EyeOff className="size-5 text-fire" />} title={t("info.privacy.never.title")}>
            <ul className="list-disc space-y-1 ps-5">
              <li>
                <span className="font-semibold">{t("info.privacy.never.phone")}</span>
              </li>
              <li>
                <span className="font-semibold">{t("info.privacy.never.ip")}</span>
              </li>
              <li>
                <span className="font-semibold">{t("info.privacy.never.email")}</span>
              </li>
            </ul>
          </Section>

          <Section icon={<Server className="size-5 text-care" />} title={t("info.privacy.where.title")}>
            {t("info.privacy.where.body")}
          </Section>

          <Section icon={<Trash2 className="size-5 text-muted-foreground" />} title={t("info.privacy.rights.title")}>
            {t("info.privacy.rights.body")}
          </Section>

          <Section icon={<Scale className="size-5 text-muted-foreground" />} title={t("info.privacy.who.title")}>
            {t("info.privacy.who.body")}{" "}
            <Link to="/terms" className="underline">
              {t("info.privacy.termsLink")}
            </Link>
            .
          </Section>
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
      <div className="mt-2 space-y-2 text-muted-foreground">{children}</div>
    </section>
  );
}

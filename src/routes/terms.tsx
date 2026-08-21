import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, HandHeart, ShieldAlert, ShieldCheck } from "lucide-react";

import { AppShell } from "@/components/AppShell";

const TITLE = "Terms of use — Green Algeria";
const DESCRIPTION =
  "The rules of the community map: honest submissions, volunteer moderation, and why this is not an emergency service.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">Terms of use</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">The deal, plainly.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Green Algeria is a community-run map. Using it means accepting a few simple rules that
          keep the map trustworthy.
        </p>

        <div className="mt-10 space-y-10">
          <Section icon={<HandHeart className="size-5 text-plant" />} title="Honest submissions">
            Only report what is real: plantings that happened, care you actually gave, fires you
            actually see. Fake or abusive submissions are rejected, and the abuse gate limits
            repeat flooding. What you post is public — post accordingly.
          </Section>

          <Section icon={<ShieldCheck className="size-5 text-plant" />} title="Volunteer moderation">
            Plantings are reviewed by volunteer moderators before they appear. They can approve,
            reject, and leave a note (visible on your receipt link). Their call keeps the counts
            honest; it is not a government certification of anything.
          </Section>

          <Section icon={<Flame className="size-5 text-fire" />} title="Not an emergency service">
            Fire reports on this map are community information, nothing more.{" "}
            <span className="font-semibold">
              In any danger, call Protection Civile on 14 or 1021 first.
            </span>{" "}
            This platform does not dispatch help, does not alert authorities, and must never be
            your only call for help.
          </Section>

          <Section icon={<ShieldAlert className="size-5 text-muted-foreground" />} title="No warranty">
            The map is built from community submissions — it can be incomplete, wrong, or out of
            date. Do not rely on it for safety, travel, or legal decisions. The platform is
            provided as is, run by volunteers, with no guarantee of availability. Your photos stay
            yours; by posting you allow the project to display them on the map. The code is open
            source under AGPL-3.0.
          </Section>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Questions: open an issue on{" "}
          <a
            href="https://github.com/Meykiio/dz-green/issues"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            GitHub
          </a>
          . Also read the{" "}
          <Link to="/privacy" className="underline">
            privacy page
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

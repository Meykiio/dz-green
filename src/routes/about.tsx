import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Map as MapIcon, Phone, ShieldCheck, Sprout } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

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
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">About</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">
          One map for every tree in Algeria.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Planting in Algeria happens everywhere and is recorded almost nowhere.
          Green Algeria is an open, community-run place to put it all on one
          map: what was planted, where, and whether anyone is still looking
          after it.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span><span className="font-semibold">You report</span> — a planting, care, or a fire. No account.</span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
            <span><span className="font-semibold">A volunteer reviews</span> — local moderators, per wilaya.</span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
            <span><span className="font-semibold">It's on the map</span> — for everyone.</span>
          </p>
        </div>

        <div className="mt-10 space-y-10">
          <Section icon={<Sprout className="size-5 text-plant" />} title="Independent">
            This platform is not affiliated with any single page, association or
            institution. It belongs to everyone planting in Algeria. Anyone can
            contribute, with or without an account — and every tree on the map
            nudges the next person to plant one.
          </Section>

          <Section icon={<ShieldCheck className="size-5 text-plant" />} title="Reviewed before it's public">
            Planting submissions are reviewed by volunteer moderators in the
            wilaya they were reported in. That keeps the tree counts honest.
            Your receipt link shows the status the moment it changes — pending,
            approved, or not approved, with the moderator's note when there is
            one.
          </Section>

          <Section icon={<ArrowRight className="size-5 text-care" />} title="Care and fire are immediate">
            Anyone can log watering or a check-up on any approved site — no
            ownership, no assignment. Fire reports skip review entirely and
            appear on the map straight away, because speed matters more than
            tidiness there.
          </Section>

          <div className="rounded-2xl border border-fire/30 bg-fire/5 p-5">
            <p className="flex items-center gap-2 font-semibold text-fire">
              <Phone className="size-4" /> This is not an emergency service
            </p>
            <p className="mt-2 text-sm">
              Green Algeria is a community map. Nobody is on duty here. If there
              is immediate danger, contact Protection Civile directly on 14 or
              1021. Reporting a fire here does not send help.
            </p>
          </div>

          <Section icon={<ShieldCheck className="size-5 text-muted-foreground" />} title="Privacy, in plain terms">
            Submissions work without an account. We never store raw IP
            addresses — only one-way hashes used to slow down spam. Your device
            secret rotates daily and is never stored raw. Reporter name and
            phone on fire reports stay on the server, unreachable from the map.
          </Section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/">
              <MapIcon className="size-4" /> Back to the map
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/plant">
              <Sprout className="size-4" /> Plant a tree
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

import { createFileRoute } from "@tanstack/react-router";
import { HandHeart } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { VolunteerForm } from "@/components/volunteer/VolunteerForm";

const TITLE = "Volunteer for your wilaya — Green Algeria";
const DESCRIPTION =
  "Help your wilaya keep the map honest, fast and alive: review plantings, triage fire reports, rally your neighbors.";

export const Route = createFileRoute("/volunteer")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: VolunteerPage,
});

function VolunteerPage() {
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">Volunteer with us</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">
          Every green dot starts with a person.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Plantings are being reported, trees are being watered, and — these
          days, hard days — fires are being watched. The map is only as true as
          the people who keep it. We're building a small local team in every
          wilaya, and we're looking for people like you.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <p className="font-semibold">What volunteers do</p>
          <ul className="mt-2 list-disc space-y-1.5 ps-5 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">Review plantings.</span> A few
              minutes a week: does this photo show what people say it does?
            </li>
            <li>
              <span className="font-medium text-foreground">Triage fire reports.</span> Verify,
              mark resolved, flag false alarms — so the community map stays useful.
            </li>
            <li>
              <span className="font-medium text-foreground">Rally your area.</span> Tell your
              neighbors, your association, your city. The map grows by word of mouth.
            </li>
          </ul>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">What we ask</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Honesty and a few minutes, a few times a week. No experience needed — we'll walk
              you through the tool together.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="font-semibold">What we never ask</p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Money, equipment, or firefighting. We are a community map, not an emergency
              service — in danger, call Protection Civile on{" "}
              <span className="font-semibold text-fire">14 or 1021</span> first.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <HandHeart className="size-5 text-plant" /> Tell us about yourself
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A short form. We read every one, and we'll answer by email or WhatsApp — that's the
            only way we contact you.
          </p>
          <div className="mt-4">
            <VolunteerForm />
          </div>
        </div>
      </article>
    </AppShell>
  );
}

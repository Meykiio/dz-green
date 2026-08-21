import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, Scale, Server, Trash2 } from "lucide-react";

import { AppShell } from "@/components/AppShell";

const TITLE = "Privacy — Green Algeria";
const DESCRIPTION =
  "What Green Algeria collects, why, what is public, and what never is. Plain language, no legal fog.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <AppShell>
      <article className="mx-auto w-full max-w-2xl px-4 py-10">
        <p className="text-xs text-muted-foreground">Privacy</p>
        <h1 className="display-hero mt-2 text-3xl sm:text-4xl">Your data, in plain terms.</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Green Algeria collects the minimum needed to run a public map and keep it honest. This
          page says exactly what that is — and what it never is.
        </p>

        <div className="mt-10 space-y-10">
          <Section icon={<Eye className="size-5 text-plant" />} title="Public on the map">
            What you send with a planting, care log or fire report: the photo, wilaya, commune,
            species and tree count, dates, your display name if you add one, and the location you
            chose. That is the point of the platform — anyone can see it.
          </Section>

          <Section icon={<EyeOff className="size-5 text-fire" />} title="Never public">
            <ul className="list-disc space-y-1 ps-5">
              <li>
                <span className="font-semibold">Your phone number</span> (if you add one on the
                plant or fire form). It exists so a moderator can call to verify a submission
                before approving it. It is stored server-side only — no visitor, no public API
                and no other user can read it, ever. It is never shared or sold.
              </li>
              <li>
                <span className="font-semibold">Your IP address and device identifier.</span> They
                are stored only as one-way hashes, used to stop spam and flooding. The raw values
                are never written down.
              </li>
              <li>
                <span className="font-semibold">Your email</span> (only if you create an account —
                most people never do). Used for sign-in only.
              </li>
            </ul>
          </Section>

          <Section icon={<Server className="size-5 text-care" />} title="Where it lives">
            The database runs on Supabase and the site on Vercel — your submissions may be stored
            on servers outside Algeria. Anonymous usage statistics (page views) are collected by
            Vercel Analytics; there is no advertising and no tracking across other sites. Theme
            and preferences stay in your own browser's local storage.
          </Section>

          <Section icon={<Trash2 className="size-5 text-muted-foreground" />} title="Your rights">
            Under Algerian law (Law 18-07 on personal data protection) you can ask to see, correct
            or delete the personal data tied to you — including a phone number you submitted.
            Open an issue on{" "}
            <a
              href="https://github.com/Meykiio/dz-green/issues"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              GitHub
            </a>{" "}
            and say what you need. Approved plantings stay on the public map (they are the map),
            but anything that identifies you personally can be removed on request.
          </Section>

          <Section icon={<Scale className="size-5 text-muted-foreground" />} title="Who runs this">
            Green Algeria is a community project run by Sifeddine Mebarki (Meykiio), Algiers — not
            a company, not a government body. Questions about this page: same GitHub link above.
            Also read the{" "}
            <Link to="/terms" className="underline">
              terms of use
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

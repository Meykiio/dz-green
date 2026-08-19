import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { photoUrl } from "@/lib/data";
import { getPublicProfile } from "@/lib/profile.functions";

const TITLE = "Profile — Green Algeria";

export const Route = createFileRoute("/u/$userId")({
  head: () => ({
    meta: [{ title: TITLE }, { property: "og:title", content: TITLE }],
  }),
  component: PublicProfilePage,
});

function PublicProfilePage() {
  const { t, formatDate, formatNumber } = useI18n();
  const { userId } = Route.useParams();
  const profile = useQuery({
    queryKey: ["profile", "public", userId],
    queryFn: () => getPublicProfile({ data: { userId } }),
    staleTime: 60_000,
  });

  const avatar = photoUrl(profile.data?.avatarUrl);
  const name = profile.data?.displayName || t.publicProfile.anonymous;

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        {profile.isLoading && <p className="text-muted-foreground">{t.common.loading}</p>}

        {(profile.isError || profile.data === null) && !profile.isLoading && (
          <div className="rounded-lg border border-border bg-card p-6 text-center">
            <p className="font-medium">{t.publicProfile.notFound}</p>
            <div className="mt-4">
              <Link to="/">
                <Button variant="secondary">{t.publicProfile.backToMap}</Button>
              </Link>
            </div>
          </div>
        )}

        {profile.data && (
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img
                  src={avatar}
                  alt={name}
                  className="size-16 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="grid size-16 place-items-center rounded-full bg-plant/15 text-xl font-semibold text-plant">
                  {name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {format(t.publicProfile.memberSince, {
                    date: formatDate(profile.data.createdAt),
                  })}
                </p>
              </div>
            </div>

            <section>
              <p className="eyebrow">{t.publicProfile.statsHeading}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  label={t.publicProfile.statPlantings}
                  value={formatNumber(profile.data.stats.plantings)}
                />
                <Stat
                  label={t.publicProfile.statTrees}
                  value={formatNumber(profile.data.stats.trees)}
                />
                <Stat
                  label={t.publicProfile.statCare}
                  value={formatNumber(profile.data.stats.careLogs)}
                />
                <Stat
                  label={t.publicProfile.statFires}
                  value={formatNumber(profile.data.stats.fireReports)}
                />
              </div>
            </section>

            <Link to="/">
              <Button variant="secondary">{t.publicProfile.backToMap}</Button>
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

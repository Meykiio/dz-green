import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PhotoInput } from "@/components/PhotoInput";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { format } from "@/i18n/format";
import { photoUrl } from "@/lib/data";
import { getMyProfile, updateMyProfile, type MyProfile } from "@/lib/profile.functions";

const TITLE = "Your profile — Green Algeria";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: TITLE },
      { property: "og:title", content: TITLE },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { t, formatDate } = useI18n();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile", "me"], queryFn: () => getMyProfile() });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // Seed the form once the profile loads (and after a save refetch).
  useEffect(() => {
    if (profile.data) {
      setName(profile.data.displayName ?? "");
      setAvatar(photoUrl(profile.data.avatarUrl));
    }
  }, [profile.data]);

  const save = useMutation({
    mutationFn: async () => {
      const isNewAvatar = !!avatar && avatar.startsWith("data:");
      const removeAvatar = !avatar && !!profile.data?.avatarUrl;
      return updateMyProfile({
        data: {
          displayName: name.trim(),
          avatar: isNewAvatar ? avatar : null,
          removeAvatar,
        },
      });
    },
    onSuccess: (data: MyProfile) => {
      queryClient.setQueryData(["profile", "me"], data);
      toast.success(t.profile.saved);
    },
    onError: (e: Error) => toast.error(e.message || t.profile.saveError),
  });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t.profile.heading}</h1>

        {profile.isLoading && (
          <div className="mt-8 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg border border-border bg-card" />
            ))}
          </div>
        )}

        {profile.isError && (
          <p className="mt-8 rounded-lg border border-fire/40 bg-fire/10 px-4 py-3 text-sm">
            {t.profile.loadError}
          </p>
        )}

        {profile.data && (
          <div className="mt-6 space-y-8">
            <form
              className="space-y-5 rounded-2xl border border-border bg-card p-4 md:p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) {
                  toast.error(t.profile.nameRequired);
                  return;
                }
                save.mutate();
              }}
            >
              <div className="max-w-[220px]">
                <PhotoInput
                  value={avatar}
                  onChange={setAvatar}
                  label={avatar ? t.profile.changeAvatar : t.profile.addAvatar}
                />
              </div>

              <label className="block">
                <span className="eyebrow">
                  {t.profile.displayName}
                  {t.field.requiredMark}
                </span>
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                  className="tap-target mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
                />
              </label>

              <div>
                <span className="eyebrow">{t.profile.email}</span>
                <p className="mt-1 text-sm">{profile.data.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.profile.emailPrivate}</p>
              </div>

              <p className="text-xs text-muted-foreground">
                {format(t.profile.joined, { date: formatDate(profile.data.createdAt) })}
              </p>

              <Button type="submit" size="lg" disabled={save.isPending}>
                {save.isPending ? t.profile.saving : t.profile.save}
              </Button>
            </form>

            <section>
              <p className="eyebrow">{t.profile.statsHeading}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label={t.publicProfile.statPlantings} value={profile.data.stats.plantings} />
                <Stat label={t.publicProfile.statTrees} value={profile.data.stats.trees} />
                <Stat label={t.publicProfile.statCare} value={profile.data.stats.careLogs} />
                <Stat label={t.publicProfile.statFires} value={profile.data.stats.fireReports} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="secondary">
                  <Link to="/activity">{t.profile.viewActivity}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/u/$userId" params={{ userId: profile.data.id }}>
                    {t.profile.viewPublic}
                  </Link>
                </Button>
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  const { formatNumber } = useI18n();
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums">{formatNumber(value)}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Droplets,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Github,
  HandHeart,
  Info,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map as MapIcon,
  Menu,
  Moon,
  ScrollText,
  ShieldCheck,
  Sprout,
  Sun,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { announcementQuery } from "@/lib/data";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/lib/privacy-mode";
import { AppDrawer } from "@/components/AppDrawer";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { LocaleDropdown } from "@/components/LocaleDropdown";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { useI18n } from "@/i18n";

const APP_PATHS = ["/moderate", "/admin", "/activity"];

const NAV_ITEMS = [
  { to: "/", key: "map", icon: MapIcon },
  { to: "/plant", key: "plant", icon: Sprout, tone: "text-plant" },
  { to: "/care", key: "care", icon: Droplets, tone: "text-care" },
  { to: "/fire", key: "fire", icon: Flame, tone: "text-fire" },
  { to: "/about", key: "about", icon: Info },
  { to: "/volunteer", key: "volunteer", icon: HandHeart },
  { to: "/privacy", key: "privacy", icon: ScrollText },
  { to: "/terms", key: "terms", icon: FileText },
  { to: "/activity", key: "activity", icon: ListChecks, requires: "user" },
  { to: "/moderate", key: "moderate", icon: ShieldCheck, requires: "moderator" },
  { to: "/admin", key: "admin", icon: LayoutDashboard, requires: "admin" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAppPage = APP_PATHS.some((p) => pathname.startsWith(p));
  return (
    <Shell isAppPage={isAppPage} pathname={pathname}>
      {children}
    </Shell>
  );
}

function Shell({
  children,
  isAppPage,
  pathname,
}: {
  children: ReactNode;
  isAppPage: boolean;
  pathname: string;
}) {
  const { user, isModerator, isAdmin } = useAuth();
  // The announcement strip (when live) sits above the top bar — the chrome
  // yields to it here (same query key as the banner, one shared fetch).
  const hasAnnouncement = (useQuery(announcementQuery).data ?? []).length > 0;
  const { theme, toggle } = useTheme();
  const { t, isRtl } = useI18n();
  const { masked, toggle: togglePrivacy } = usePrivacyMode();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isStaffPage = isAppPage || pathname.startsWith("/moderate");

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      void navigate({ to: "/" });
    }
  }

  const rows = NAV_ITEMS.filter((r) => {
    if (!("requires" in r)) return true;
    const q = r.requires;
    return q === "user" ? !!user : q === "moderator" ? isModerator : isAdmin;
  }).map((r) => ({
    to: r.to,
    label: t(`chrome.nav.${r.key}`),
    icon: r.icon,
    tone: "tone" in r ? r.tone : undefined,
  }));

  const brandName = isRtl ? "الجزائر الخضراء" : "Green Algeria";

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? t("chrome.aria.themeLight") : t("chrome.aria.themeDark")}
      className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
    >{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
  );

  // Locale picker: a real dropdown with all three languages (2026-09-01).

  const authAction = user ? (
    <button
      type="button"
      onClick={() => void signOut()}
      className="tap-target inline-flex items-center gap-1.5 rounded-full px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">{t("chrome.auth.signout")}</span>
    </button>
  ) : (
    <Link
      to="/auth"
      className="tap-target inline-flex items-center rounded-full px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {t("chrome.auth.signin")}
    </Link>
  );

  const navRow = ({ to, label, icon: Icon, ...rest }: (typeof rows)[number]) => {
    const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
    return (
      <Link
        key={to}
        to={to}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
          active
            ? "bg-accent font-semibold text-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        <span className={cn("size-1.5 rounded-full", active ? "bg-primary" : "bg-transparent")} />
        <Icon className={cn("size-4", rest.tone)} />
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Slim top bar everywhere: hamburger + brand left, SOS + feedback + theme right. */}
      <header
        className={cn(
          "fixed inset-x-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-3 backdrop-blur-md",
          hasAnnouncement ? "top-9" : "top-0",
        )}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("chrome.aria.openMenu")}
            className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
          >
            <Menu className="size-5" />
          </button>
          {/* Brand hidden on phones — the hamburger already carries Home. */}
          <Link to="/" className="hidden items-center gap-2 px-1 sm:flex">
            <img src="/logo.png" alt="" className="size-5" />
            <span className="text-base font-semibold tracking-tight">{brandName}</span>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          {isStaffPage && (
            <button
              type="button"
              onClick={togglePrivacy}
              aria-label={masked ? t("chrome.aria.privacyShow") : t("chrome.aria.privacyHide")}
              className={cn(
                "tap-target inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold transition-transform active:scale-[0.97]",
                masked
                  ? "border-plant/40 bg-plant/10 text-plant"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {masked ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              <span className="hidden sm:inline">
                {masked ? t("chrome.privacy.showInfos") : t("chrome.privacy.hideInfos")}
              </span>
            </button>
          )}
          <EmergencyContacts />
          <FeedbackDialog />
          <a
            href="https://github.com/Meykiio/dz-green"
            target="_blank"
            rel="noreferrer"
            aria-label={t("chrome.aria.github")}
            className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
          >
            <Github className="size-5" />
          </a>
          <LocaleDropdown />
          {themeButton}
        </div>
      </header>

      {/* Drawer — the whole nav, on every viewport (extracted to AppDrawer). */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        hasAnnouncement={hasAnnouncement}
        brandName={brandName}
        rows={rows.map(navRow)}
        themeButton={themeButton}
        authAction={authAction}
      />

      {/* Desktop static sidebar on app pages only. */}
      {isAppPage && (
        <aside
          className={cn(
            "fixed inset-y-0 start-0 z-30 hidden w-60 flex-col border-e border-sidebar-border bg-sidebar md:flex",
            hasAnnouncement ? "pt-[5.75rem]" : "pt-14",
          )}
        >
          <nav aria-label={t("chrome.aria.sections")} className="mt-2 flex-1 space-y-1 px-3 py-2">
            {rows.map(navRow)}
          </nav>
          <div className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3">
            {authAction}
          </div>
        </aside>
      )}

      <main className={cn("flex-1", hasAnnouncement ? "pt-[5.75rem]" : "pt-14", isAppPage && "md:ms-60")}>
        {children}
      </main>
    </div>
  );
}

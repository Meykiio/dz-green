import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Eye, EyeOff, Github, LogOut, Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { announcementQuery } from "@/lib/data";
import { cn } from "@/lib/utils";
import { usePrivacyMode } from "@/lib/privacy-mode";
import { AppDrawer } from "@/components/AppDrawer";
import { ConsentBanner } from "@/components/ConsentBanner";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { LocaleDropdown } from "@/components/LocaleDropdown";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { StaffSidebar } from "@/components/shell/StaffSidebar";
import { GROUP_SPECS, NAV_ITEMS, type NavItem } from "@/components/shell/nav";
import { useI18n } from "@/i18n";

const APP_PATHS = ["/moderate", "/admin", "/activity"];

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

  // Role-filtered nav, grouped Miller-style (5 / 3 / 3) for drawer + sidebar.
  const byKey = new Map(
    NAV_ITEMS.filter((r) => {
      if (!r.requires) return true;
      const q = r.requires;
      return q === "user" ? !!user : q === "moderator" ? isModerator : isAdmin;
    }).map((r) => [r.key, r]),
  );
  const groups = GROUP_SPECS.map((g) => ({
    key: g.key,
    label: t(`chrome.navGroup.${g.key}`),
    rows: g.items
      .map((item) => byKey.get(item))
      .filter((item): item is NavItem => Boolean(item))
      .map(navRow),
  }));

  const brandName = isRtl ? "الجزائر الخضراء" : "Green Algeria";

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? t("chrome.aria.themeLight") : t("chrome.aria.themeDark")}
      className="tap-target grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
    >{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</button>
  );

  // Filming privacy mode: staff screens mask PII by default. Staff-only —
  // it never renders for signed-out visitors or plain users.
  const privacyButton = isModerator ? (
    <button
      type="button"
      onClick={togglePrivacy}
      aria-label={masked ? t("chrome.aria.privacyShow") : t("chrome.aria.privacyHide")}
      className="tap-target grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
    >
      {masked ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  ) : null;

  const authAction = user ? (
    <button
      type="button"
      onClick={() => void signOut()}
      className="tap-target inline-flex items-center gap-1.5 rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="staff-row-label hidden sm:inline">{t("chrome.auth.signout")}</span>
    </button>
  ) : (
    <Link
      to="/auth"
      className="tap-target inline-flex items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <span className="staff-row-label">{t("chrome.auth.signin")}</span>
    </Link>
  );

  function navRow(item: NavItem) {
    const label = t(`chrome.nav.${item.key}`);
    const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
    return (
      <Link
        key={item.to}
        to={item.to}
        data-active={active ? "true" : undefined}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={cn(
          "staff-row flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[color,background-color,transform] duration-200 ease-[var(--ease-out)] hover:translate-x-[3px] rtl:hover:-translate-x-[3px]",
          active
            ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <item.icon className={cn("size-4 shrink-0", item.tone)} />
        <span className="staff-row-label truncate">{label}</span>
      </Link>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Slim top bar on public pages, and on staff pages below lg. From lg
          up on staff pages the sidebar IS the shell (Canopy: topbar is the
          mobile pattern) — SOS/feedback/GitHub stay public-chrome only. */}
      <header
        className={cn(
          "fixed inset-x-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-3 backdrop-blur-md",
          hasAnnouncement ? "top-9" : "top-0",
          isAppPage && "lg:hidden",
        )}
      >
        <div className="flex items-center gap-1">
          {/* On staff pages the sidebar IS the nav from lg up — the drawer
              (and its hamburger) only exists below that. */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t("chrome.aria.openMenu")}
            className={cn(
              "tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]",
              isAppPage && "lg:hidden",
            )}
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
          <EmergencyContacts />
          <FeedbackDialog />
          <a
            href="https://github.com/Meykiio/dz-green"
            target="_blank"
            rel="noreferrer"
            aria-label={t("chrome.aria.github")}
            className="tap-target grid size-10 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
          >
            <Github className="size-5" />
          </a>
          <LocaleDropdown />
          <span className="hidden sm:inline">{themeButton}</span>
        </div>
      </header>

      {/* Drawer — the whole nav, on every viewport (extracted to AppDrawer). */}
      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        hasAnnouncement={hasAnnouncement}
        brandName={brandName}
        groups={groups}
        themeButton={themeButton}
        privacyButton={privacyButton}
        authAction={authAction}
      />

      {/* Staff pages: the Canopy sidebar (280px → 78px rail, lg+ only). */}
      {isAppPage && (
        <StaffSidebar
          groups={groups}
          hasAnnouncement={hasAnnouncement}
          brandName={brandName}
          themeButton={themeButton}
          localePicker={<LocaleDropdown />}
          privacyButton={privacyButton}
          authAction={authAction}
        />
      )}

      <main
        className={cn(
          "flex-1 transition-[margin] duration-[450ms] ease-[var(--ease-out)]",
          isAppPage
            ? hasAnnouncement
              ? "pt-[5.75rem] lg:pt-9"
              : "pt-14 lg:pt-0"
            : hasAnnouncement
              ? "pt-[5.75rem]"
              : "pt-14",
          isAppPage && "lg:ms-[var(--staff-w)]",
        )}
      >
        {children}
      </main>
      <ConsentBanner />
    </div>
  );
}

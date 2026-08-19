import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Droplets,
  Flame,
  Info,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map as MapIcon,
  Menu,
  Moon,
  ShieldCheck,
  Sprout,
  Sun,
  TreePine,
  User,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useI18n } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { EmergencyContacts } from "@/components/EmergencyContacts";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const ACTIONS = [
  { to: "/plant", labelKey: "plantShort", icon: Sprout, tone: "text-plant" },
  { to: "/care", labelKey: "careShort", icon: Droplets, tone: "text-care" },
  { to: "/fire", labelKey: "fireShort", icon: Flame, tone: "text-fire" },
] as const;

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
  const { theme, toggle } = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/" });
  }

  const rows = [
    { to: "/", label: t.nav.map, icon: MapIcon, show: true },
    { to: "/plant", label: t.nav.plant, icon: Sprout, show: true, tone: "text-plant" },
    { to: "/care", label: t.nav.care, icon: Droplets, show: true, tone: "text-care" },
    { to: "/fire", label: t.nav.fire, icon: Flame, show: true, tone: "text-fire" },
    { to: "/about", label: t.nav.about, icon: Info, show: true },
    { to: "/profile", label: t.nav.profile, icon: User, show: !!user },
    { to: "/activity", label: t.nav.activity, icon: ListChecks, show: !!user },
    { to: "/moderate", label: t.nav.moderate, icon: ShieldCheck, show: isModerator },
    { to: "/admin", label: t.nav.admin, icon: LayoutDashboard, show: isAdmin },
  ].filter((r) => r.show);

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? t.theme.toLight : t.theme.toDark}
      className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );

  const authAction = user ? (
    <button
      type="button"
      onClick={() => void signOut()}
      className="tap-target inline-flex items-center gap-1.5 rounded-full px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="size-4" />
      <span className="hidden sm:inline">{t.nav.signOut}</span>
    </button>
  ) : (
    <Link
      to="/auth"
      className="tap-target inline-flex items-center rounded-full px-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {t.nav.signIn}
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
        <Icon className={cn("size-4", "tone" in rest && rest.tone)} />
        {label}
      </Link>
    );
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Slim top bar everywhere: hamburger + brand left, SOS + feedback + theme right. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 px-3 backdrop-blur-md">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t.nav.openMenu}
            className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-[0.96]"
          >
            <Menu className="size-5" />
          </button>
          <Link to="/" className="flex items-center gap-2 px-1">
            <TreePine className="size-5 shrink-0 text-plant" />
            {/* Icon-only logo on phones; the wordmark returns at sm+ so the
                top-bar controls (SOS, feedback, language, theme) never crowd or
                overflow the bar at phone widths. */}
            <span className="hidden truncate text-base font-semibold tracking-tight sm:inline">
              {t.nav.brand}
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <EmergencyContacts />
          <FeedbackDialog />
          <LanguageSwitcher />
          {themeButton}
        </div>
      </header>

      {/* Drawer — the whole nav, on every viewport. */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-72 flex-col border-e border-border bg-card transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          // The drawer is anchored to the inline-start edge; hiding it must move
          // toward that edge in both directions (physical translate doesn't flip
          // for RTL, so mirror it explicitly).
          drawerOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
        )}
        aria-label={t.nav.menu}
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
      >
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="flex items-center gap-2">
            <TreePine className="size-5 text-plant" />
            <span className="text-base font-semibold tracking-tight">{t.nav.brand}</span>
          </span>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label={t.nav.closeMenu}
            className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav aria-label={t.nav.main} className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {rows.map(navRow)}
        </nav>
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          {themeButton}
          {authAction}
        </div>
      </aside>

      {/* Desktop static sidebar on app pages only. */}
      {isAppPage && (
        <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col border-e border-sidebar-border bg-sidebar pt-14 md:flex">
          <nav aria-label={t.nav.sections} className="mt-2 flex-1 space-y-1 px-3 py-2">
            {rows.map(navRow)}
          </nav>
          <div className="flex items-center gap-2 border-t border-sidebar-border px-4 py-3">
            {authAction}
          </div>
        </aside>
      )}

      <main className={cn("flex-1 pt-14", isAppPage && "md:ms-60", !isAppPage && "pb-20 md:pb-0")}>
        {children}
      </main>

      {/* Sticky one-tap actions on mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-2 border-t border-border bg-card/95 p-2 backdrop-blur md:hidden">
        {ACTIONS.map(({ to, labelKey, icon: Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className="tap-target flex flex-col items-center justify-center gap-1 rounded-lg bg-background py-2 text-xs font-medium transition-transform active:scale-[0.97]"
          >
            <Icon className={`size-5 ${tone}`} />
            {t.nav[labelKey]}
          </Link>
        ))}
      </nav>
    </div>
  );
}

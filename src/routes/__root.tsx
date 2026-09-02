import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Analytics } from "@vercel/analytics/react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { PwaInstallBanner } from "@/components/pwa-install";
import { I18nProvider, ssrT } from "@/i18n";
import { localeInitScript } from "@/i18n";
import { getLocale, initLocale } from "@/i18n/locale";
import { PrivacyModeProvider } from "@/lib/privacy-mode";
import { getGeoHint } from "@/lib/geo-hint";
import { registerServiceWorker } from "@/lib/pwa";

/**
 * Error/404 boundaries render OUTSIDE the route tree (in place of the root
 * component), so they cannot use the I18nProvider context — `useI18n` would
 * throw and mask the real error. They use `ssrT` (module singleton) instead.
 */
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {ssrT("chrome.browser.notFoundHeading")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {ssrT("chrome.browser.notFoundBody")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ssrT("chrome.browser.goHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {ssrT("chrome.browser.loadErrorHeading")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ssrT("chrome.browser.loadErrorBody")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {ssrT("chrome.browser.retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            {ssrT("chrome.browser.goHome")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Green Algeria" },
      { name: "description", content: "a crowdsourced public platform for Algeria's tree-planting and environmental-protection movement" },
      { property: "og:title", content: "Green Algeria" },
      { property: "og:description", content: "a crowdsourced public platform for Algeria's tree-planting and environmental-protection movement" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Green Algeria" },
      { name: "twitter:description", content: "a crowdsourced public platform for Algeria's tree-planting and environmental-protection movement" },
      { name: "theme-color", content: "#2ead4b" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "الجزائر الخضراء" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  // initLocale reads the request-global on the server (set by src/server.ts
  // from the visitor's cookie) and window.__GA_LOCALE__ on the client — so
  // SSR text and the first client render always match (React #418 fix).
  initLocale();
  const locale = getLocale();
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("ga-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: localeInitScript(),
          }}
        />
        {/* Geo hint: SSR only — the client keeps the value from page load. */}
        {typeof document === "undefined" ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__GA_GEO__=${JSON.stringify(getGeoHint())}`,
            }}
          />
        ) : null}
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <PrivacyModeProvider>
          <TooltipProvider delayDuration={300}>
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
            <AnnouncementBanner />
            <PwaInstallBanner />
            <Toaster position="top-center" richColors />
            {/* Vercel Web Analytics — self-contained loader script; no-ops off-Vercel. */}
            <Analytics />
          </TooltipProvider>
        </PrivacyModeProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

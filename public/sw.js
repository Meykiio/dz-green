// Green Algeria service worker (PWA phase A, 2026-08-31).
// Deliberately tiny: static-asset cache + push handlers. NO page caching —
// the app is SSR and pages must always be fresh (staleness bugs live there).
const CACHE = "ga-static-v1";
const PRECACHE = ["/logo.png", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  const isStatic = url.pathname.startsWith("/assets/") || PRECACHE.includes(url.pathname);
  if (!isStatic) return; // network as usual
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ||
        fetch(event.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
          return res;
        }),
    ),
  );
});

// --- Push (phase B sends the payloads; the handlers live here already so
// enabling alerts never requires a service-worker update) ---
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "الجزائر الخضراء";
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: (data.data && data.data.url) || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        return clients.openWindow(url);
      }),
  );
});

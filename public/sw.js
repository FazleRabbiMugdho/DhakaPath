/* DhakaPath service worker — offline-first shell.
   - Precache the core shell on install.
   - Navigations: network-first, fall back to the cached /app shell when offline.
   - Static assets (_next, icons, transit svgs): stale-while-revalidate.
   - OSM map tiles are never cached (the app falls back to its offline schematic). */

const VERSION = "dhakapath-v2";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const PRECACHE = ["/app", "/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()).catch(() => undefined)
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isTile(url) {
  return /tile\.openstreetmap\.org/.test(url) || /\.tile\./.test(url);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Never cache map tiles or cross-origin API calls.
  if (isTile(url.href) || url.origin !== self.location.origin) return;

  // Navigations: network-first with an offline shell fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy)).catch(() => undefined);
          return res;
        })
        .catch(() => caches.match(req).then((m) => m || caches.match("/app")))
    );
    return;
  }

  // Static assets: serve from cache, refresh in the background.
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/transit/") || url.pathname.endsWith(".svg") || url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(ASSETS).then((c) => c.put(req, copy)).catch(() => undefined);
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

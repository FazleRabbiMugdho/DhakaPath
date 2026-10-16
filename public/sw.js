// Minimal Service Worker placeholder to gracefully handle stale client service worker requests
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

"use strict";
/* Service worker — coquille hors-ligne + installabilité (PWA).
 * Statique : cache-first. API : réseau uniquement (jamais mis en cache). */
const CACHE = "amesoeur-v1";
const SHELL = ["/", "/index.html", "/styles.css", "/engine.js", "/avatar.js", "/data.js", "/app.js", "/manifest.webmanifest"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;          // laisse passer (fonts, etc.)
  if (url.pathname.startsWith("/api/")) return;        // API : jamais de cache
  e.respondWith(
    caches.match(req).then((hit) => hit ||
      fetch(req).then((res) => {
        if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match("/index.html")))
  );
});

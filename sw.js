/* Service Worker: speichert die Simulation fuer die Offline-Nutzung.
   Bei Aenderungen an index.html: VERSION hochzaehlen (ohne-tipps-v1 -> ohne-tipps-v2) und mit hochladen.
   Dieselbe Bezeichnung muss am Ende der index.html bei caches.open(...) stehen. */
const VERSION = "sehfehler-ohne-tipps-v1";
const DATEIEN = ["./", "index.html", "manifest.json", "icon-180.png", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(n => n !== VERSION && n.indexOf("sehfehler-ohne-tipps-") === 0).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

/* Zuerst aus dem Speicher (schnell + offline), im Hintergrund aktualisieren, wenn online. */
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;            // fremde Seiten nicht anfassen
  const istSeite = e.request.mode === "navigate";
  e.respondWith(
    caches.open(VERSION).then(c =>
      c.match(istSeite ? "index.html" : e.request, { ignoreSearch: true }).then(gespeichert => {
        const netz = fetch(e.request).then(antwort => {
          if (antwort && antwort.ok) c.put(istSeite ? "index.html" : e.request, antwort.clone());
          return antwort;
        }).catch(() => gespeichert);
        return gespeichert || netz;
      })
    )
  );
});

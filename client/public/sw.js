const CACHE = "flytech-shell-v3";
const BASE_URL = new URL(self.registration.scope);
const SHELL = [
  BASE_URL.toString(),
  new URL("manifest.webmanifest", BASE_URL).toString(),
  new URL("icon.svg", BASE_URL).toString()
];
const ASSET_PREFIX = new URL("assets/", BASE_URL).pathname;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => (key.startsWith("flightdeck-shell-") || key.startsWith("flytech-shell-")) && key !== CACHE).map(key => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(BASE_URL.toString(), copy));
        }
        return response;
      }).catch(() => caches.match(BASE_URL.toString()))
    );
    return;
  }

  if (url.pathname.startsWith(ASSET_PREFIX)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});

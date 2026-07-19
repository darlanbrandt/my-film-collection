/* My Film Collection — service worker
 * Makes the app installable and usable offline. Bump CACHE_VERSION whenever the
 * caching strategy changes to force old caches out.
 */
const CACHE_VERSION = "mfc-v1";
const SHELL_CACHE    = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE  = `${CACHE_VERSION}-runtime`;
const IMAGE_CACHE    = `${CACHE_VERSION}-images`;
const IMAGE_MAX      = 120; // cap cached posters/backdrops

const SHELL_ASSETS = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Trim a cache to a maximum number of entries (oldest first).
async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys  = await cache.keys();
  if (keys.length <= max) return;
  for (const req of keys.slice(0, keys.length - max)) await cache.delete(req);
}

async function staleWhileRevalidate(request, cacheName) {
  const cache    = await caches.open(cacheName);
  const cached   = await cache.match(request);
  const network  = fetch(request)
    .then((res) => { if (res && res.ok) cache.put(request, res.clone()); return res; })
    .catch(() => cached);
  return cached || network;
}

async function cacheFirst(request, cacheName, max) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) { cache.put(request, res.clone()); if (max) trimCache(cacheName, max); }
  return res;
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put("/", res.clone());
    return res;
  } catch {
    return (await cache.match(request)) || (await cache.match("/")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // App navigations → network-first, fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  // Same-origin static assets (hashed JS/CSS, icons) → stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Google Fonts (static, versioned) → cache-first.
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    return;
  }

  // TMDB poster/backdrop images → cache-first with a bounded cache.
  if (url.hostname === "image.tmdb.org") {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, IMAGE_MAX));
    return;
  }

  // Everything else (Supabase data, TMDB/OMDB proxy) → straight to network so we
  // never serve stale data. If offline it simply fails, and the app's own
  // localStorage cache handles the read path.
});

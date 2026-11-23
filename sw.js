// Opens instantly from the saved copy, then quietly downloads any update in the
// background; the update shows the next time the app is opened.
const CACHE = "med-guide-v8";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./welcome.jpg", "./logo-mark.png", "./logo.png",
  "./favicon-32.png", "./icon-180.png", "./icon-192.png", "./icon-512.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const same = url.origin === location.origin;
  if (!same && !FONT_HOSTS.includes(url.hostname)) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = (same && req.mode === "navigate") ? "./index.html" : req;
    const cached = await cache.match(key, { ignoreSearch: same });
    const network = fetch(req).then(res => {
      if (res.ok || res.type === "opaque") cache.put(key, res.clone());
      return res;
    });
    if (cached) { e.waitUntil(network.catch(() => {})); return cached; }
    try { return await network; }
    catch (err) { return (await cache.match("./index.html")) || Response.error(); }
  })());
});

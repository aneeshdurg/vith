const cacheName = "notedownPWA-v2";
const appShellFiles = [
  "/vith/",
  "/vith/index.html",
  "/vith/icons/icon144x144.png",
  "/vith/icons/icon72x72.png",
  "/vith/icons/icon192x192.png",
  "/vith/icons/icon128x128.png",
  "/vith/icons/icon96x96.png",
  "/vith/icons/icon152x152.png",
  "/vith/icons/icon512x512.png",
  "/vith/icons/icon384x384.png",
  "/vith/video-synth.js",
  "/vith/vith.webmanifest",
  "/vith/style.css",
  "/vith/video-synth.umd.cjs"
];

self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching all: app shell and content");
      await cache.addAll(appShellFiles);
    })(),
  )
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    (async () => {
      const r = await caches.match(e.request, { ignoreSearch: true });
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (r) {
        return r;
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })(),
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          return caches.delete(key);
        }),
      );
    }),
  );
});

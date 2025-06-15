//Current version
const VERSION = "1.0.0";

//Name for our app cache
const CACHE_NAME = "tumobeat";

//Assets to be cached
const cachedAssets = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/manifest.json",
  "/images/app_logo.svg",
  "/images/icons-192.webp",
  "/images/icons-512.webp",
  "/images/icons-vector.svg",
  "/images/maskable_icon.webp",
  "/images/screenshot1.png",
  "/images/screenshot2.png",
];

let isUpdate = false;
self.addEventListener("install", async (event) => {
  isUpdate = await caches.has(CACHE_NAME);
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(cachedAssets);
  await self.skipWaiting();

  // Store the current version number in the cache
  await cache.put("version", new Response(VERSION));
});

self.addEventListener("activate", async (event) => {
  //Clean old cached versions still in memory if is an update.
  if (isUpdate) {
    const oldCache = await caches.open(CACHE_NAME);
    if (oldCache) await oldCache.delete(CACHE_NAME);
  }
  // Check the version number stored in the cache
  const cache = await caches.open(CACHE_NAME);
  const cachedVersion = await cache.match("version");
  const currentVersion = new Response(VERSION);

  if (cachedVersion !== currentVersion && isUpdate) {
    // If its not the first install and if the version numbers don't match it means there is an update,
    // send update warning to clients
    await clients.claim();
    const clis = await self.clients.matchAll({ type: "window" });
    clis.forEach((client) => {
      client.postMessage({
        type: "update",
        message: "Update available!",
      });
    });
  }
});
self.addEventListener("fetch", async (event) => {
  const responsePromise = (async () => {
    const cachedResponse = await caches.match(event.request);
    return cachedResponse ? cachedResponse : fetch(event.request);
  })();
  event.respondWith(responsePromise);
});

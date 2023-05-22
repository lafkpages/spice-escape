const cacheName = "spice-escape";
const origin = "https://spice-escape.luisafk.repl.co";
const assets = [
  "/",
  "/style.css",
  "/script.js",
  "/sw.js",
  "/favicon.png",
  "/favicon.ico",
  "/manifest.json",
  "/abilities.json",
  "/img/headerNoHotSauce.png",
  "/img/header.png",
  "/img/hotSauce.png",
  "/img/players.png",
  "/img/terrain.png",
  "/img/flags.png",
  "/img/frozen.png",
  "/img/spice.png",
  "/img/spice2.png",
  "/img/abilities/killer/freeze.png",
  "/img/abilities/killer/spice.png",
  "/img/abilities/killer/spice2.png",
  "/img/abilities/killer/sprint.png",
  "/img/abilities/runner/freeze.png",
  "/img/abilities/runner/heal.png",
  "/img/abilities/runner/sprint.png",
  // '/img/.png',
];

function compareUrls(a, b, o = origin) {
  if (a == b) return true;
  else if (a && b) {
    a = new URL(a, o);
    b = new URL(b, o);

    return a.href == b.href;
  } else {
    return false;
  }
}

self.addEventListener("install", (e) => {
  console.log("Caching all assets");

  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      cache.addAll(assets);
    })
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method != "GET") return;

  let matched = false;
  for (const asset of assets) {
    if (compareUrls(asset, e.request.url)) {
      matched = true;
      break;
    }
  }

  if (!matched) {
    console.log("Ignored:", e.request.url);
    return;
  }

  e.respondWith(
    (async () => {
      const r = await caches.match(e.request);

      console.log(`Fetching resource: ${e.request.url}`);

      if (r) return r;

      const response = await fetch(e.request);

      const cache = await caches.open(cacheName);

      console.log(`Caching new resource: ${e.request.url}`);

      cache.put(e.request, response.clone());

      return response;
    })()
  );
});

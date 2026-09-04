const CACHE_NAME = "ishakboutarfa-store-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./sw.js",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js",
  "https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Tajawal:wght@300;400;500;700;900&display=swap"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        APP_SHELL.map(async (resource) => {
          try {
            await cache.add(resource);
          } catch (error) {
            console.warn("تعذر تخزين المورد مؤقتًا:", resource);
          }
        })
      );

      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  if (
    requestUrl.origin === self.location.origin ||
    requestUrl.origin === "https://www.gstatic.com" ||
    requestUrl.origin === "https://fonts.googleapis.com"
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const networkRequest = fetch(event.request)
          .then((response) => {
            const copy = response.clone();

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });

            return response;
          })
          .catch(() => cached);

        return cached || networkRequest;
      })
    );
  }
});

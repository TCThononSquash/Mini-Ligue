
const CACHE_NAME = "tc-thonon-pwa-v7";
const BASE = "/Mini-Ligue/pwa/";

const FILES_TO_CACHE = [
  BASE,
  BASE + "index.html",
  BASE + "Infos/",
  BASE + "Infos/index.html",
  BASE + "RGPD/",
  BASE + "RGPD/index.html",
  BASE + "Dashboards/",
  BASE + "Dashboards/index.html",
  BASE + "Saisie/",
  BASE + 'Saisie/index.html',
  BASE + "SignInSignOut/",
  BASE + 'SignInSignOut/index.html',
  BASE + "manifest.webmanifest",
  BASE + "assets/icons/icon-192.png",
  BASE + "assets/icons/icon-512.png",
  BASE + "assets/icons/TC-Thonon-Squash-Logo.png"
];

// Installation : sauvegarder les fichiers essentiels.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activation : supprimer les anciens caches PWA.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(
        names
          .filter(name =>
            name.startsWith("tc-thonon-pwa-") &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

// Intercepter les requêtes de la PWA.
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(BASE)
  ) {
    return;
  }

  // Navigation : réseau d'abord, cache en secours.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, copy)
            )
          );
        }
        return response;
      }).catch(async () => {
        return (await caches.match(request)) ||
               (await caches.match(BASE));
      })
    );
    return;
  }

  // Ressources : cache d'abord.
  event.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request)
    )
  );
});


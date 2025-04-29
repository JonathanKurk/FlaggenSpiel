// --- START OF FILE service-worker.js ---

const CACHE_NAME = 'flaggen-ratespiel-cache-v2'; // WICHTIG: Versionsnummer erhöht!
const DATA_CACHE_NAME = 'flaggen-data-cache-v1'; // Separater Cache für Flaggen
const urlsToCache = [
  // Wichtig: Pfade relativ zum Root der Website (wo der SW liegt)
  '/', // Startpunkt
  '.', // Alternative Start-URL Referenz
  'index.html',
  'style.css',
  'script.js',
  'utils/i18n.js',
  'ui/startScreen.js',
  'ui/gameUI.js',
  'ui/flagListModal.js',
  'manifest.json', // Manifest auch cachen
  // WICHTIG: Füge hier die korrekten Pfade zu deinen Icons hinzu!
  'icons/icon-144x144.png',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  // Optionale, aber empfohlene kleinere Icons
  'icons/icon-72x72.png',
  'icons/icon-96x96.png',
  // Die Google Font Anfrage kann offline Probleme machen, wenn sie *während* der Installation fehlschlägt.
  // Besser wäre, die Schrift lokal zu hosten oder sie nicht aggressiv vorzucachen.
  // 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap' // Vorerst auskommentiert für Robustheit
];

// Installation: Cacht die App-Shell
self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell files:', urlsToCache);
        // addAll stoppt bei erstem Fehler. Stattdessen einzeln hinzufügen? Für Einfachheit erstmal addAll.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting on install');
        return self.skipWaiting(); // Erzwingt, dass der neue SW sofort aktiv wird
      })
      .catch(error => {
        console.error('[Service Worker] Caching app shell failed:', error);
        // Hier könnte man versuchen, einzeln zu cachen, um Teil-Caching zu ermöglichen
      })
  );
});

// Aktivierung: Bereinigt alte Caches und übernimmt Kontrolle
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  // Liste der zu behaltenden Caches
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Wenn Cache nicht in der Whitelist ist -> löschen
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      // Übernimmt sofort Kontrolle über alle offenen Clients (Tabs)
      return self.clients.claim();
    })
  );
});

// Fetch: Fängt Netzwerkanfragen ab
self.addEventListener('fetch', event => {
  const reqUrl = event.request.url;
  // Ignoriere Anfragen, die nicht http/https sind (z.B. chrome-extension://)
  if (!reqUrl.startsWith('http')) {
      return;
  }

  // console.log('[Service Worker] Fetching resource:', reqUrl); // Kann sehr gesprächig sein

  // Strategie 1: API-Anfrage für die Länderliste (nur die initiale)
  // Diese soll *immer* ans Netzwerk gehen, da wir keine Daten-Caching-Logik wollen.
  if (reqUrl.includes('restcountries.com/v3.1/all')) {
    // console.log('[Service Worker] Letting API call (all countries) pass through to network.');
    event.respondWith(fetch(event.request));
    return; // Nicht weiter bearbeiten
  }

  // Strategie 2: Flaggenbilder (.svg, oft von wikimedia oder flagcdn)
  // "Network falling back to Cache" + Cache on success
  // Prüft auf .svg Endung UND bekannte Domains für Flaggen
  if (reqUrl.endsWith('.svg') && (reqUrl.includes('upload.wikimedia.org') || reqUrl.includes('flagcdn.com'))) {
    // console.log('[Service Worker] Handling Flag Image Request:', reqUrl);
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        // 1. Versuche Netzwerk
        return fetch(event.request)
          .then(networkResponse => {
            // 2. Bei Erfolg: In Cache speichern (Kopie!) und zurückgeben
            // console.log('[Service Worker] Flag fetched from Network, caching:', reqUrl);
            // Nur erfolgreiche Antworten (Status 200) cachen
            if (networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // 3. Bei Netzwerkfehler (offline): Versuchen, aus Cache zu laden
            // console.log('[Service Worker] Network failed for flag, trying cache:', reqUrl);
            return cache.match(event.request).then(cachedResponse => {
              if (cachedResponse) {
                // console.log('[Service Worker] Flag found in cache:', reqUrl);
                return cachedResponse;
              }
              // 4. Wenn weder Netzwerk noch Cache -> Fehler
              console.error('[Service Worker] Flag not found in network or cache:', reqUrl);
              // Wichtig: Eine Fehlerantwort zurückgeben, damit .onerror im JS ausgelöst wird
              return new Response('', { status: 404, statusText: 'Not Found (Offline/Not Cached)' });
            });
          });
      })
    );
    return; // Bearbeitung hier beendet
  }

  // Strategie 3: App-Shell Anfragen (HTML, CSS, JS, lokale Icons, Manifest, etc.)
  // "Cache falling back to Network" (Standard-Strategie für die App selbst)
  // console.log('[Service Worker] Handling App Shell Request:', reqUrl);
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Wenn im Cache gefunden -> liefern
        if (cachedResponse) {
          // console.log('[Service Worker] Found in App Shell Cache:', reqUrl);
          return cachedResponse;
        }
        // Wenn nicht im Cache -> vom Netzwerk holen (wird hier nicht gecached, nur im 'install')
        // console.log('[Service Worker] Not in App Shell Cache, fetching from network:', reqUrl);
        return fetch(event.request);
      })
      .catch(error => {
        console.error('[Service Worker] Fetch failed for app shell resource:', reqUrl, error);
        // Optional: Hier könnte eine generische Offline-Seite angezeigt werden,
        // wenn selbst die index.html nicht im Cache ist.
        // return caches.match('offline.html'); // Falls man eine offline.html gecached hat
      })
  );
});

// --- END OF FILE service-worker.js ---

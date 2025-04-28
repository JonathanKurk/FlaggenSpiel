// --- START OF FILE service-worker.js ---

const CACHE_NAME = 'flaggen-ratespiel-cache-v1'; // Ändere v1 zu v2 usw., wenn du wichtige Dateien aktualisierst
const urlsToCache = [
  '/', // Wichtig, um die Startseite zu cachen
  'index.html',
  'style.css',
  'script.js',
  'utils/i18n.js',
  'ui/startScreen.js',
  'ui/gameUI.js',
  'ui/flagListModal.js',
  // Füge hier weitere wichtige Assets hinzu, z.B. Schriftarten oder das Standard-Icon,
  // ABER NICHT die Länder-API-URL (https://restcountries.com/...)
  // Beispiel für Icon: 'icons/icon-192x192.png'
  // Stelle sicher, dass alle Pfade korrekt sind relativ zur index.html
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap' // Beispiel für externe Ressource
];

// Installation: Öffnet den Cache und fügt die Kern-Assets hinzu
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        // Wichtig: fetch kann für externe Ressourcen fehlschlagen, wenn offline.
        // Besser wäre es, externe Ressourcen wie Fonts evtl. anders zu handhaben
        // oder sicherzustellen, dass addAll auch bei einzelnen Fehlern weitermacht.
        // Für einen einfachen Cache ist das aber erstmal okay.
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        self.skipWaiting(); // Erzwingt, dass der neue SW sofort aktiv wird
      })
      .catch(error => {
        console.error('Service Worker: Caching failed', error);
      })
  );
});

// Aktivierung: Bereinigt alte Caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim(); // Übernimmt Kontrolle über offene Clients
    })
  );
});

// Fetch: Liefert Ressourcen aus dem Cache oder vom Netzwerk
self.addEventListener('fetch', event => {
  // Wir wollen API-Anfragen an restcountries.com *nicht* aus dem Cache bedienen (außer vielleicht mit komplexerer Logik)
  // Daher lassen wir sie einfach durch zum Netzwerk.
  if (event.request.url.includes('restcountries.com')) {
    // console.log('Service Worker: Fetching from network (API):', event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  // Für alle anderen Anfragen (App-Shell, CSS, JS, etc.): Cache first
  // console.log('Service Worker: Fetching resource:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          // console.log('Service Worker: Found in cache:', event.request.url);
          return response; // Aus dem Cache liefern
        }
        // console.log('Service Worker: Not in cache, fetching from network:', event.request.url);
        return fetch(event.request); // Vom Netzwerk holen
      })
      .catch(error => {
        console.error('Service Worker: Fetch failed', error);
        // Optional: Hier könnte man eine Offline-Fallback-Seite anzeigen
      })
  );
});

// --- END OF FILE service-worker.js ---
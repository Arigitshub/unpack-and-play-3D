const CACHE_NAME = 'unpack-and-play-3d-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/main.js',
  '/catalog.json',
  '/assets/daylight.hdr',
  '/assets/models/bed_01.glb',
  '/assets/models/dresser_01.glb',
  '/assets/models/lamp_01.glb',
  '/assets/models/plant_01.glb',
  '/assets/models/rug_01.glb'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
      )
  );
});

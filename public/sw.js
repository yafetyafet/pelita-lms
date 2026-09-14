self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  self.registration.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // A simple pass-through to satisfy PWA requirements
  e.respondWith(fetch(e.request).catch(() => new Response("Offline")));
});

// Evidence service worker for fixing tprotocol issues
// This is a minimal service worker that handles protocol fixes

self.addEventListener('install', function(event) {
  console.log('[Service Worker] Installing...');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Activated');
  // Take control of all pages immediately
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function(event) {
  // Let all requests pass through normally
  // This service worker primarily exists to prevent 404 errors
  return;
});
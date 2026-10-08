/* Service worker for "Climb with me".
   - Makes the page installable as an app.
   - Keeps the page shell (HTML, font, icons) available offline,
     e.g. in a gym basement without signal.
   - Always tries the network first for the page itself, so updates
     you push to GitHub show up right away.
   - Never caches the Apps Script data (sessions, joins…): that always
     comes live from Google.
   Bump VERSION when you change sw.js itself. */
const VERSION = 'cwm-v8';
const SHELL = ['./', './index.html', './rechtliches.html', './bungee.woff2', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
               './favicon.ico', './favicon-16.png', './favicon-32.png', './favicon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;   // Apps Script etc.: straight to the network

  if (req.mode === 'navigate') {
    // the page: network first, cached copy if offline
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(VERSION).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  // font, icons: cache first
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});

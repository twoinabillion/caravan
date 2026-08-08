const CACHE = 'seoul-400km-shell-v1';
const SHELL = ['./', './index.html', './서울까지400km.html', './assets/app-icon.png', './manifest.webmanifest'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('seoul-400km-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

/* The game is one self-contained document. Cache later-loaded static resources too,
   but never make a failed network request hide a previously cached journey shell. */
self.addEventListener('fetch', event => {
  if(event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(hit => {
    if(hit) return hit;
    return fetch(event.request).then(response => {
      if(response.ok && new URL(event.request.url).origin === self.location.origin){
        const copy=response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => event.request.mode === 'navigate'
      ? caches.match('./서울까지400km.html')
      : Response.error());
  }));
});

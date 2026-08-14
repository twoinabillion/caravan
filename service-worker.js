const CACHE = 'seoul-400km-shell-v3';
const SHELL = [
  './', './index.html', './서울까지400km.html', './manifest.webmanifest',
  './assets/app-icon.png', './assets/app-icon-192.png', './assets/app-icon-512.png'
];

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
  const url = new URL(event.request.url);
  const isDocument = event.request.mode === 'navigate' || url.pathname.endsWith('.html');
  if(isDocument){
    /* 설치된 앱은 온라인일 때 HTTP 캐시보다 배포본을 먼저 확인한다. GitHub에
       새 HTML이 올라오면 다음 실행에서 곧바로 받고, 실패할 때만 마지막 판으로 간다. */
    const latest = new Request(event.request, {cache:'no-store'});
    event.respondWith(fetch(latest).then(response => {
      if(response.ok && url.origin === self.location.origin){
        const copy=response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request).then(hit => hit || caches.match('./서울까지400km.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit => {
    if(hit) return hit;
    return fetch(event.request).then(response => {
      if(response.ok && new URL(event.request.url).origin === self.location.origin){
        const copy=response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => Response.error());
  }));
});

// Build: 20261105224003
const CACHE_NAME = 'mi-practice-20261105224003';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
const OPTIONAL = ['./backend.js'];   // 講師後台網址；沒有這個檔也照常安裝

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).then(() =>
    Promise.all(OPTIONAL.map(u => c.add(u).catch(() => {}))))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
  self.clients.claim();
  // 通知所有頁面有新版本
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
  });
});

// 有網路時一律拿最新的檔案，順便更新離線備份；沒有網路時才用備份
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(resp => {
      if (resp && resp.ok) {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
      }
      return resp;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(r =>
      r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});

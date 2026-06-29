const APP_CACHE = 'takao-app-v1';
const TILE_CACHE = 'takao-tiles-v1';
const APP_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(APP_CACHE).then(c => c.addAll(APP_ASSETS).catch(()=>{})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k!==APP_CACHE && k!==TILE_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // 地図タイル: キャッシュ優先(オフラインでも表示)
  if (url.includes('cyberjapandata.gsi.go.jp/xyz/')) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(TILE_CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => hit))
    );
    return;
  }
  // 標高API: ネット優先・失敗時は無視(埋め込み値で動く)
  if (url.includes('getelevation.php')) return;
  // アプリ資産: キャッシュ優先
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});

const CACHE_NAME = 'nippo-app-v1';
const ASSETS = [
  'index.html',
  'style.css',
  'app.js',
  'manifest.json'
];

// インストール時にアプリ資材をキャッシュ
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 通信フェッチ時の制御
self.addEventListener('fetch', (e) => {
  // GAS（スプレッドシート）へのリアルタイムデータ通信はキャッシュを完全にバイパスする
  if (e.request.url.includes('script.google.com')) {
    return;
  }
  
  // アプリの画面パーツ（HTML/CSS/JS）はキャッシュから超高速ロード
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});
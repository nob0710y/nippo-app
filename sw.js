// サービスワーカーの基本設定（今回はインストールを許可するためだけの最小構成）
self.addEventListener('install', (e) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (e) => {
  // ネットワーク通信をそのまま通す
  e.respondWith(fetch(e.request));
});
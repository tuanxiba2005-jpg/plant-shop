const CACHE_NAME = 'plant-shop-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/css/style.css',
  '/manifest.json',
  '/images/logo.png'
];

// Cài đặt Service Worker và lưu cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Xóa cache cũ khi có phiên bản mới
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Lấy dữ liệu từ Cache nếu mất mạng (Offline fallback)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

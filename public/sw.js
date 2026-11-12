self.addEventListener('install', () => {
  // Langsung aktifkan versi terbaru setiap kali ada update kode
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Biarkan request berjalan langsung agar setiap update di Vercel langsung tampil di HP
});
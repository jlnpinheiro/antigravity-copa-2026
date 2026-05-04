self.addEventListener('install', (e) => {
    // Service Worker instalado
    self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
    // Handler básico obrigatório para que navegadores (como Chrome)
    // reconheçam o app como um PWA instalável offline.
});

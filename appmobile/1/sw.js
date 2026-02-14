// Service Worker pour cache optimisé
const CACHE_NAME = 'agtelecom-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './chefintervention.html',
    './chefdetails.html',
    './carte-interventions.html',
    './verification-inventaire.html',
    './Inventaire.html',
    '../../js/config.js',
    '../../js/api.js'
];

// Installation - mise en cache des ressources statiques
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activation - suppression des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Stratégie: Network First pour Supabase, Cache First pour assets
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Toujours réseau pour Supabase
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(fetch(request));
        return;
    }

    // Toujours réseau pour les CDN externes (mais avec timeout)
    if (url.hostname.includes('cdn.jsdelivr.net') || 
        url.hostname.includes('unpkg.com') ||
        url.hostname.includes('fonts.googleapis.com') ||
        url.hostname.includes('cdn.tailwindcss.com')) {
        event.respondWith(
            fetch(request, { cache: 'force-cache' })
                .catch(() => caches.match(request))
        );
        return;
    }

    // Cache First pour les assets locaux
    event.respondWith(
        caches.match(request).then((response) => {
            return response || fetch(request).then((fetchResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        })
    );
});

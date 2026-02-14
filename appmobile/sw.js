// Service Worker pour cache optimisé - App Mobile
const CACHE_NAME = 'agtelecom-mobile-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './acceuil_Personnel.html',
    './Rendez-vous_technicien.html',
    './details_intervention.html',
    './invetaire_technicien.html',
    '../js/config.js',
    '../js/api.js'
];

// Installation
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// Activation
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

// Fetch strategy
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Network First pour Supabase
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(fetch(request));
        return;
    }

    // Force-cache pour CDN avec fallback
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

    // Cache First pour assets locaux
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

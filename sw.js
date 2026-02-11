// Service Worker - Cache 74h
const CACHE_NAME = 'agtelecom-web-v2'; // v2: Fix POST requests et API externes
const CACHE_TTL_MS = 74 * 60 * 60 * 1000; // 74h

const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './dashboard.html',
    './production.html',
    './pointage.html',
    './planif.html',
    './personnel.html',
    './parametres.html',
    './mandats.html',
    './gantt-mensuel.html',
    './admin-create-user.html',
    './test-supabase.html',
    './js/config.js',
    './js/api.js',
    './js/role-access-control.js'
];

const getMetaUrl = (requestUrl) => {
    const separator = requestUrl.includes('?') ? '&' : '?';
    return `${requestUrl}${separator}__meta=1`;
};

const isFresh = async (cache, request) => {
    const meta = await cache.match(getMetaUrl(request.url));
    if (!meta) return false;
    try {
        const { time } = await meta.json();
        return Date.now() - time <= CACHE_TTL_MS;
    } catch {
        return false;
    }
};

const putWithMeta = async (cache, request, response) => {
    await cache.put(request, response.clone());
    await cache.put(
        getMetaUrl(request.url),
        new Response(JSON.stringify({ time: Date.now() }), {
            headers: { 'Content-Type': 'application/json' }
        })
    );
};

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cacheName) =>
                    cacheName !== CACHE_NAME ? caches.delete(cacheName) : undefined
                )
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignore POST/PUT/DELETE requests (Cache API only supports GET)
    if (request.method !== 'GET') {
        event.respondWith(fetch(request));
        return;
    }

    // Network first for Supabase
    if (url.hostname.includes('supabase.co')) {
        event.respondWith(fetch(request));
        return;
    }

    // Network first for external APIs (PDF analysis, Ollama, webhooks, etc.)
    if (url.hostname.includes('easypanel.host') || 
        url.hostname.includes('n8n.') ||
        !url.hostname.includes('localhost') && url.hostname !== location.hostname) {
        event.respondWith(fetch(request));
        return;
    }

    // Cache with TTL for local assets and CDN
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            const cached = await cache.match(request);
            const fresh = cached ? await isFresh(cache, request) : false;

            if (cached && fresh) {
                return cached;
            }

            try {
                const response = await fetch(request, { cache: 'no-store' });
                if (response && response.ok) {
                    await putWithMeta(cache, request, response.clone());
                }
                return response;
            } catch (error) {
                // Offline fallback: return cached even if expired
                if (cached) return cached;
                throw error;
            }
        })
    );
});

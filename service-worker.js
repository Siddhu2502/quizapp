// Service Worker for Quiz App - Offline Support
const CACHE_NAME = 'quiz-app-v1';
const RUNTIME_CACHE = 'quiz-runtime-v1';

// Files to cache immediately on install
const PRECACHE_URLS = [
    './',
    './index.html',
    './style.css',
    './js/app.js',
    './js/state.js',
    './js/storage.js',
    './js/utils.js',
    './js/dataService.js',
    './js/quizLogic.js',
    './js/renderer.js',
    './js/eventHandlers.js'
];

// Install event - cache core files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Skip cross-origin requests
    if (url.origin !== self.location.origin) {
        return;
    }
    
    // Return index.html for all navigation requests (routing)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch('/index.html').catch(() => caches.match('/index.html'))
        );
        return;
    }

    // Network-first strategy for JSON files (quiz content)
    if (url.pathname.includes('.json')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Clone and cache the response
                    const responseClone = response.clone();
                    caches.open(RUNTIME_CACHE).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Fallback to cache if offline
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request).then(response => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(RUNTIME_CACHE).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
    );
});

// Handle messages from the app
self.addEventListener('message', event => {
    // Verify origin for security
    if (event.origin !== self.location.origin) {
        return;
    }
    
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});

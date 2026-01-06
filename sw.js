const CACHE_NAME = 'gurukul-v1';
const ASSETS = [
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Event: Cache Core Assets
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Fetch Event: Network First for Data, Cache First for Assets
self.addEventListener('fetch', (e) => {
    const url = new URL(e.request.url);

    // If it's a Firebase request or external API, try network first
    if (url.href.includes('firebase') || url.href.includes('googleapis')) {
        return; // Let browser handle normally (checking online)
    }

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // Return cached response if found
            if (cachedResponse) {
                return cachedResponse;
            }
            // Otherwise fetch from network
            return fetch(e.request).then((response) => {
                // Don't cache non-successful responses or cross-origin if not needed
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });
                return response;
            });
        })
    );
});


        // This will be extracted and saved as sw.js
        const CACHE_NAME = 'pcb-cost-tracker-v1';
        const urlsToCache = [
            './',
            './index.html',
            'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
            'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js'
        ];

        // Install Service Worker
        self.addEventListener('install', event => {
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then(cache => {
                        console.log('Opened cache');
                        return cache.addAll(urlsToCache);
                    })
            );
        });

        // Cache and return requests
        self.addEventListener('fetch', event => {
            event.respondWith(
                caches.match(event.request)
                    .then(response => {
                        // Cache hit - return response
                        if (response) {
                            return response;
                        }
                        return fetch(event.request).then(
                            response => {
                                // Check if we received a valid response
                                if (!response || response.status !== 200 || response.type !== 'basic') {
                                    return response;
                                }

                                // Clone the response
                                const responseToCache = response.clone();

                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(event.request, responseToCache);
                                    });

                                return response;
                            }
                        );
                    })
            );
        });

        // Update Service Worker
        self.addEventListener('activate', event => {
            const cacheWhitelist = [CACHE_NAME];
            event.waitUntil(
                caches.keys().then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => {
                            if (cacheWhitelist.indexOf(cacheName) === -1) {
                                return caches.delete(cacheName);
                            }
                        })
                    );
                })
            );
        });
    
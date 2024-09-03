self.addEventListener('install', event => {
    event.waitUntil(
        caches.open('static-cache')
            .then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/offline.html',
                    '/emocoes.html',
                    '/emocao.html',
                    '/lista-gratidao.html',
                    '/css/geral.css',
                    '/js/emocoes.js',
                    '/js/gratidao.js',
                    '/img/brain.svg',
                    '//cdn.jsdelivr.net/npm/daisyui@4.12.10/dist/full.min.css',
                    '//cdn.tailwindcss.com',
                    '//cdn.jsdelivr.net/npm/sweetalert2@11.12.4/dist/sweetalert2.min.css',
                    '//cdn.jsdelivr.net/npm/dexie@3/dist/dexie.js',
                    '//cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
                    '//cdn.jsdelivr.net/npm/sweetalert2@11.12.4/dist/sweetalert2.all.min.js',
                    '//cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js',
                    '//cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/vfs_fonts.js',
                    '//cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
                ]);
            })
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(request)
                .then(cachedResponse => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    return fetch(request).then(networkResponse => {
                        if (networkResponse.status === 200) {
                            caches.open('static-cache').then(cache => {
                                cache.put(request, networkResponse.clone());
                            });
                        }

                        return networkResponse;
                    }).catch(() => {
                        // Handle network errors
                        return caches.match('/offline.html');
                    });
                })
        );
    }
});
self.addEventListener('install', event => {
    event.waitUntil(
        self.skipWaiting().then(() => caches.open('static-cache').then(cache => {
            return cache.addAll([
                '/',
                '/index.html',
                '/offline.html',
                '/emocoes.html',
                '/emocao.html',
                '/lista-gratidao.html',
                '/css/tailwind.min.css',
                '/js/worker-logic.js',
                '/js/emocoes.js',
                '/js/gratidao.js',
                '/img/brain.svg',
                '//cdn.jsdelivr.net/npm/sweetalert2@11.12.4/dist/sweetalert2.min.css',
                '//cdn.jsdelivr.net/npm/dexie@4.0.8/dist/dexie.min.js',
                '//cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
                '//cdn.jsdelivr.net/npm/sweetalert2@11.12.4/dist/sweetalert2.all.min.js',
                '//cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/pdfmake.min.js',
                '//cdn.jsdelivr.net/npm/pdfmake@0.2.12/build/vfs_fonts.js',
                '//cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
            ]);
        }))
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({
            type: "window",
        })
            .then(clientList => {
                if (clientList.length) {
                    clientList[0].focus();
                }
            })
    );
});

const notifyEmo = function () {
    self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
    }).then((clients) => {
        if (clients && clients.length) {
            clients[0].postMessage({
                type: 'LEMBRETE_EMO'
            });
        }
    });
}

let interval;
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'LEMBRETE_EMO_INIT') {
        if (interval) clearInterval(interval);
        interval = setInterval(notifyEmo, 60000); //every minute
    }
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (url.origin === self.location.origin) {
        event.respondWith(
            caches.match(request).then(cachedResponse => {

                return fetch(request).then(networkResponse => {
                    if (networkResponse.status >= 200 && networkResponse.status < 300) {
                        // Check if the content has changed
                        if (cachedResponse && networkResponse.headers.get('ETag') !== cachedResponse.headers.get('ETag')) {
                            caches.open('static-cache').then(cache => {
                                cache.put(request, networkResponse.clone());
                            });
                        }

                        return networkResponse.clone(); // Clone the response before returning it
                    }

                    return networkResponse;
                }).catch(() => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    else {
                        // fallback offline page
                        return caches.match('/offline.html');
                    }
                });
            })
        );
    }
});
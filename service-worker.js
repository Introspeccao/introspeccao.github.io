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
        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(clientList => {
            if (clientList.length) {
                clientList[0].focus();
            }
        })
    );
});

const sendMessage = (message, error) => {
    self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
    }).then((clients) => {
        if (clients && clients.length) {
            clients[0].postMessage((error ? { err: message } : { msg: message }));
        }
    });
}

const notifyEmo = function () {
    try {
        indexedDB.open('retro_emocoes').then((db) => {
            if (db.objectStoreNames.contains('horas')) {
                const transaction   = db.transaction('horas', 'readonly');
                const store         = transaction.objectStore('horas');
                const getAllRequest = store.getAll();

                getAllRequest.onsuccess = function(event) {
                    const horarios = event.target.result.map((item) => { return item.hora; });
                    const now      = new Date();
                    const hora     = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

                    if (horarios && horarios.indexOf(hora) !== -1) {
                        sendMessage.call(this, "Bateu na hora!");
                        self.registration.showNotification("Lembrete", {
                            body: "Sentiu uma emoção recentemente que queira registar?",
                            icon: "https://introspeccao.github.io/img/brain.svg",
                            requireInteraction: true
                        }).catch((error) => {
                            sendMessage.call(this, error, true);
                        });
                    }

                    db.close();
                }
            }
            else {
                db.close();
            }
        });
    }
    catch (e) {
    }
}

let interval;
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'LEMBRETE_EMO_INIT') {
        if (interval) clearInterval(interval);
        notifyEmo.call(this);
        interval = setInterval(notifyEmo.bind(this), 60000); //every minute
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
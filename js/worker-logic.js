if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(registration => {
        if ('Notification' in window && Notification.permission === 'granted') {
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data.msg) {
                    console.log('Message from worker:', event.data.msg);
                }
                else if (event.data.err) {
                    console.error('Error from worker:', event.data.err);
                }
            });

            // Wait for service worker activation
            navigator.serviceWorker.ready.then( registration => {
                registration.active.postMessage({
                    type: 'LEMBRETE_EMO_INIT'
                });
            });
        }
    });
}
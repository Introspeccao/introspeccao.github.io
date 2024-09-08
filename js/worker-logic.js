if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(async registration => {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    registration.active.postMessage({
                        type: 'LEMBRETE_EMO_INIT'
                    });
                }
            });

            navigator.serviceWorker.onmessage = (event) => {
                if (event.data && event.data.type === 'LEMBRETE_EMO') {
                    try {
                        const horarios = JSON.parse(localStorage.getItem('horarios'));
                        const now = new Date();
                        const hora = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

                        if (horarios && horarios.indexOf(hora) !== -1) {
                            registration.showNotification("Lembrete", {
                                body: "Sentiu uma emoção recentemente que queira registar?",
                                icon: "img/brain.svg",
                                requireInteraction: true
                            });
                        }
                    }
                    catch (e) {}
                }
            };
        }
    });
}
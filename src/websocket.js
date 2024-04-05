import { onMounted, onUnmounted, ref } from "vue";

export function useWebSocket({ onOpen, onClose, onMessage }) {
    const socket = ref(null);

    onMounted(() => initWebSocket()
        .then(ws => {
            socket.value = ws;
            onOpen(ws);
            ws.addEventListener('message', (evt) => {
                try {
                    onMessage(JSON.parse(evt.data), ws);
                } catch {
                }
            });
        })
        .catch((err) => console.error(err))
    );
    onUnmounted(() => {
        if (socket.value && socket.value.readyState === WebSocket.OPEN) {
            onClose(socket.value);
            socket.value.close();
        }
        socket.value = null;
    });

    return { socket };
}

function initWebSocket() {
	const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
	const ws = new WebSocket(`${proto}//${window.location.host}/websocket`);
    return new Promise((resolve, reject) => {
        ws.addEventListener('open', () => resolve(ws));
        ws.addEventListener('error', (err) => reject(err));
    });
}
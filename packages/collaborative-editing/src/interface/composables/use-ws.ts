import { useSdk } from '@directus/extensions-sdk';
import { realtime } from '@directus/sdk';
import { useSessionStorage } from '@vueuse/core';
import { ref } from 'vue';

const _state: { ws: ReturnType<typeof createWS> | undefined } = {
	ws: undefined,
};

export interface WSHandler {
	open?: () => void;
	error?: () => void;
	close?: () => void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	message: Array<(message: any) => void>;
}

function createWS() {
	const ws = useSdk().with(
		realtime({
			authMode: 'strict',
			reconnect: { delay: 1000, retries: 10 },
		}),
	);

	const refreshId = useSessionStorage<string | null>('realtime-session-id', null);

	const handlers: WSHandler = {
		message: [],
	};

	function onOpen(cb: WSHandler['open']) {
		if (!handlers['open']) {
			handlers['open'] = cb;
		}
	}

	function onClose(cb: WSHandler['close']) {
		if (!handlers['close']) {
			handlers['close'] = cb;
		}
	}

	function onError(cb: WSHandler['error']) {
		if (!handlers['error']) {
			handlers['error'] = cb;
		}
	}

	function onMessage<T = unknown>(cb: (message: T) => void) {
		handlers['message'].push(cb);
	}

	const connected = ref(false);

	ws.onWebSocket('open', function () {
		connected.value = true;

		this.addEventListener('message', (message: MessageEvent) => {
			let payload;
			try {
				payload = JSON.parse(message.data);
			} catch {
				// ignore
				return;
			}

			// For token expiry it should auto refresh right away instead of waiting for token to expire
			if (payload.type === 'auth' && payload.status === 'error' && payload.error?.code === 'TOKEN_EXPIRED') {
				this.close();
			}
		});

		handlers.open?.();
	});

	ws.onWebSocket('close', () => {
		connected.value = false;

		handlers.close?.();
	});

	ws.onWebSocket('error', () => {
		connected.value = false;

		handlers.error?.();
	});

	ws.onWebSocket('message', (message) => {
		handlers.message.forEach((m) => m(message));
	});

	return {
		client: ws,
		connected,
		refreshId,
		onOpen,
		onClose,
		onError,
		onMessage,
	};
}

export function useWS() {
	if (_state.ws) return _state.ws;

	_state.ws = createWS();

	return _state.ws;
}

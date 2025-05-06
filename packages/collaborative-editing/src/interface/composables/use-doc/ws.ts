import { useSdk } from '@directus/extensions-sdk';
import { realtime } from '@directus/sdk';
import { ref } from 'vue';

const _state: { ws: ReturnType<typeof createWS> | undefined } = {
	ws: undefined,
};

export interface UseWSOptions {
	onOpen?(): void;
	onClose?(): void;
	onError?(): void;
	onMessage?(message: unknown): void;
}

export interface WSHandler {
	open?: () => void;
	error?: () => void;
	close?: () => void;
	message: Array<(message: unknown) => void>;
}

function createWS(opts: UseWSOptions) {
	const ws = useSdk().with(
		realtime({
			authMode: 'strict',
			reconnect: { delay: 1000, retries: 10 },
		}),
	);

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

	function onMessage(cb: (message: unknown) => void) {
		handlers['message'].push(cb);
	}

	const connected = ref(false);

	ws.onWebSocket('open', () => {
		connected.value = true;

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
		onOpen,
		onClose,
		onError,
		onMessage,
	};
}

export function useWS(opts: UseWSOptions = {}) {
	if (_state.ws) return _state.ws;

	_state.ws = createWS(opts);

	return _state.ws;
}

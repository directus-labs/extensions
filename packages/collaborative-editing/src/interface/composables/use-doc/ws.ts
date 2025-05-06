import { useSdk } from '@directus/extensions-sdk';
import type { WebSocketClient } from '@directus/sdk';
import { realtime } from '@directus/sdk';
import { Ref, ref } from 'vue';

const _state: { ws: { client: WebSocketClient<unknown>; connected: Ref<boolean> } | undefined } = {
	ws: undefined,
};

function createWS() {
	const ws = useSdk().with(
		realtime({
			authMode: 'strict',
			reconnect: { delay: 1000, retries: 10 },
		}),
	);

	const connected = ref(false);

	ws.onWebSocket('open', () => (connected.value = true));

	ws.onWebSocket('close', () => (connected.value = false));

	ws.onWebSocket('error', () => (connected.value = false));

	return {
		client: ws,
		connected,
	};
}

export function useWS() {
	if (_state.ws) return _state.ws;

	_state.ws = createWS();

	return _state.ws;
}

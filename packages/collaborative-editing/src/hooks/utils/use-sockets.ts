import { DirectusWebsocket } from '../types';

const _state: { sockets: Set<DirectusWebsocket> | undefined } = {
	sockets: undefined,
};

export function useSockets() {
	if (_state.sockets) return _state.sockets;

	_state.sockets = new Set();

	return _state.sockets;
}

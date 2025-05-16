import { DirectusWebsocket } from '../types';

export interface Socket {
	client: DirectusWebsocket;
	rooms: Set<string>;
}

const _state: { sockets: Map<string, Socket> | undefined } = {
	sockets: undefined,
};

export function useSockets() {
	if (_state.sockets) return _state.sockets;

	_state.sockets = new Map();

	return _state.sockets;
}

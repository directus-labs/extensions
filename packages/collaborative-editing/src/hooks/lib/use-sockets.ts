import { RealtimeSocket } from '../types';

const _state: { sockets: Map<string, RealtimeSocket> | undefined } = {
	sockets: undefined,
};

export function useSockets() {
	if (_state.sockets) return _state.sockets;

	_state.sockets = new Map();

	return _state.sockets;
}

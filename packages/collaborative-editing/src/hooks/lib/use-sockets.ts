import { RealtimeSocket } from '../types';

const cache: { sockets: Map<string, RealtimeSocket> | undefined } = {
	sockets: undefined,
};

export function useSockets() {
	if (cache.sockets) return cache.sockets;

	cache.sockets = new Map();

	return cache.sockets;
}

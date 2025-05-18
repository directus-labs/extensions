import { RealtimeSocket } from '../types';

export function isValidSocket(socket?: RealtimeSocket): socket is RealtimeSocket {
	if (!socket) return false;
	if (socket.deleted) return false;
	if (!socket.client.accountability?.user) return false;
	return true;
}

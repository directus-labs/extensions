import { useSockets } from '../modules/use-sockets';
import { RealtimeWebSocket } from '../types';
import { isValidSocket } from './is-valid-socket';

export function getSocketById(client: RealtimeWebSocket) {
	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (isValidSocket(socket) && socket.client.id === client.id) {
			return socket;
		}
	}
}

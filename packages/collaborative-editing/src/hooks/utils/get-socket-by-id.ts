import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';
import { isValidSocket } from './is-valid-socket';

export function getSocketById(client: DirectusWebsocket) {
	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (socket.id === client.id && isValidSocket(socket)) {
			return socket;
		}
	}
}

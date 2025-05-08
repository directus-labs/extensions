import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';

export function isLastUserSocket(client: DirectusWebsocket) {
	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (socket.id === client.id && socket.uid !== client.uid) {
			return false;
		}
	}

	return true;
}

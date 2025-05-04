import { DirectusWebsocket } from '../types';
import { useSockets } from '../utils/use-sockets';

export function handleConnect(client: DirectusWebsocket) {
	console.log(`${client.uid} marked as yjs client`);

	const sockets = useSockets();

	client.rooms = new Set();

	sockets.add(client);
}

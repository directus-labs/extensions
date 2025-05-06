import { ConnectMessage, ConnectPayload } from '../../types/events';
import { DirectusWebsocket } from '../types';
import { useSockets } from '../utils/use-sockets';

export function handleConnect(client: DirectusWebsocket, message: ConnectMessage) {
	console.log(`market connection ${client.uid} as yjs client`);

	const sockets = useSockets();

	client.rooms = new Set();

	client.color = message.color;

	sockets.set(client.uid, client);

	const payload: ConnectPayload = { event: 'connected' };

	client.send(JSON.stringify(payload));
}

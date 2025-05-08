import { ConnectMessage, ConnectPayload } from '../../types/events';
import { DirectusWebsocket } from '../types';
import { useId } from '../utils/use-id';
import { useSockets } from '../utils/use-sockets';

export function handleConnect(client: DirectusWebsocket, message: ConnectMessage) {
	const sockets = useSockets();
	const { getId } = useId();

	client.rooms = new Set();

	client.id = getId(client.accountability.user!);

	client.color = message.color;

	sockets.set(client.uid, client);

	const payload: ConnectPayload = { event: 'connected' };

	client.send(JSON.stringify(payload));

	console.log(`market connection ${client.id} as yjs client`);
}

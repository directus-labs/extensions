import { ConnectMessage, ConnectPayload } from '../../types/events';
import { useId } from '../modules/use-id';
import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';

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

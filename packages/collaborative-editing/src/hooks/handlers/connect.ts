import { ConnectMessage, ConnectPayload } from '../../types/events';
import { useId } from '../modules/use-id';
import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';

export function handleConnect(client: DirectusWebsocket, message: Omit<ConnectMessage, 'type'>) {
	const sockets = useSockets();
	const { getId } = useId();

	client.rooms = new Set();

	client.id = getId(client.accountability.user!);

	client.color = message.color;

	sockets.set(client.uid, client);

	const payload: ConnectPayload = { event: 'connected' };

	console.log(
		`[realtime:connect] Client ${client.uid} marked as a yjs client for user ${client.accountability.user} with color ${client.color}`,
	);

	client.send(JSON.stringify(payload));
}

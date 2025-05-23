import { ConnectMessage, ConnectPayload } from '../../shared/types/events';
import { useId } from '../lib/use-id';
import { useSockets } from '../lib/use-sockets';
import { RealtimeWebSocket } from '../types';

export function handleConnect(client: RealtimeWebSocket, message: Omit<ConnectMessage, 'type'>) {
	const { color } = message;

	const sockets = useSockets();
	const { getId } = useId();

	const rooms = new Set<string>();

	// Add back rooms on re-connect
	if (message.rooms && message.rooms.length) {
		console.log(
			`[realtime:connect] Refresh detected for client ${client.uid}, rejoining rooms ${message.rooms.join(',')}`,
		);
		// rejoin rooms
		rooms.forEach((r) => rooms.add(r));
	}

	client.id = getId(client.accountability.user!);
	client.color = color;

	sockets.set(client.uid, { client, rooms });

	console.log(
		`[realtime:connect] Client ${client.uid} marked as a yjs client for user ${client.accountability.user} with color ${client.color}`,
	);

	const payload: ConnectPayload = { event: 'connected' };
	client.send(JSON.stringify(payload));
}

import { ConnectMessage, ConnectPayload } from '../../types/events';
import { useId } from '../modules/use-id';
import { useJobs } from '../modules/use-jobs';
import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';
import { getSocketById } from '../utils/get-socket-by-id';

export function handleConnect(client: DirectusWebsocket, message: Omit<ConnectMessage, 'type'>) {
	const sockets = useSockets();
	const jobs = useJobs();
	const { getId } = useId();

	client.rooms = new Set();

	// Add back rooms on re-connect
	if (message.refresh) {
		console.log(`[realtime:connect] Refresh detected for client ${client.uid}, rejoining rooms`);
		const socket = getSocketById(client);

		if (socket) {
			// cancel leave job
			jobs.cancel(client.id);

			// rejoin rooms
			socket.rooms.forEach((r) => client.rooms.add(r));
		}
	}

	client.id = getId(client.accountability.user!);

	client.color = message.color;

	sockets.set(client.uid, client);

	const payload: ConnectPayload = { event: 'connected' };

	console.log(
		`[realtime:connect] Client ${client.uid} marked as a yjs client for user ${client.accountability.user} with color ${client.color}`,
	);

	client.send(JSON.stringify(payload));
}

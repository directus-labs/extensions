import { REFRESH_CLOSE_WINDOW_MS } from '../constants';
import { useJobs } from '../modules/use-jobs';
import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';
import { isValidSocket } from '../utils/is-valid-socket';
import { handleLeave } from './leave';

export function handleClose(client: DirectusWebsocket) {
	const jobs = useJobs();
	const sockets = useSockets();

	// delay deletion in case of refresh
	jobs.add(
		client.id,
		() => {
			// leave all rooms
			const clientSocket = sockets.get(client.uid);
				if (!isValidSocket(clientSocket)) return;

				clientSocket.rooms.forEach((room: string) => {
				handleLeave(client, { room });
			});

			sockets.delete(client.uid);

			console.log(`[realtime:close] Client ${client.uid} has closed the connection, removed from all rooms`);
		},
		{ delay: REFRESH_CLOSE_WINDOW_MS },
	);
}

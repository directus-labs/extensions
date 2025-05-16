import { REFRESH_CLOSE_WINDOW_MS } from '../constants';
import { useJobs } from '../modules/use-jobs';
import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';
import { handleLeave } from './leave';

export function handleClose(client: DirectusWebsocket) {
	const jobs = useJobs();
	const sockets = useSockets();

	// delay deletion in case of refresh
	jobs.add(
		client.id,
		() => {
			// leave all rooms
			client.rooms.forEach((room: string) => {
				handleLeave(client, { room });
			});

			sockets.delete(client.uid);

			console.log(`[realtime:close] Client ${client.uid} has closed the connection, removed from all rooms`);
		},
		{ delay: REFRESH_CLOSE_WINDOW_MS },
	);
}

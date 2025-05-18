import { REFRESH_CLOSE_WINDOW_MS } from '../constants';
import { useJobs } from '../modules/use-jobs';
import { useSockets } from '../modules/use-sockets';
import { RealtimeWebSocket } from '../types';
import { handleLeave } from './leave';

export function handleClose(client: RealtimeWebSocket) {
	const jobs = useJobs();
	const sockets = useSockets();

	const socket = sockets.get(client.uid);

	if (!socket) {
		return;
	}

	// mark as deleted
	socket.deleted = true;

	// delay actual deletion in case of refresh
	jobs.add(
		client.id,
		() => {
			// leave all rooms
			sockets.get(client.uid)?.rooms.forEach((room: string) => {
				handleLeave(client, { room });
			});

			sockets.delete(client.uid);

			console.log(`[realtime:close] Client ${client.uid} has closed the connection, removed from all rooms`);
		},
		{ delay: REFRESH_CLOSE_WINDOW_MS },
	);
}

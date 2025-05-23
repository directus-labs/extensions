import { useSockets } from '../modules/use-sockets';
import { Context, RealtimeWebSocket } from '../types';
import { handleLeave } from './leave';

export function handleClose(client: RealtimeWebSocket, ctx: Context) {
	const sockets = useSockets();

	const socket = sockets.get(client.uid);

	if (!socket) {
		return;
	}

	// leave all rooms
	sockets.get(client.uid)?.rooms.forEach((room: string) => {
		handleLeave(client, { room }, ctx);
	});

	sockets.delete(client.uid);

	console.log(`[realtime:close] Client ${client.uid} has closed the connection, removed from all rooms`);
}

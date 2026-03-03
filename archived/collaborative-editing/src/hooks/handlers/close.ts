import { useSockets } from '../lib/use-sockets';
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
}

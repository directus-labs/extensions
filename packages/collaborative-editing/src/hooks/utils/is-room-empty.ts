import { useSockets } from '../modules/use-sockets';

export function isRoomEmpty(room: string) {
	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (socket.rooms.has(room)) {
			return false;
		}
	}

	return true;
}

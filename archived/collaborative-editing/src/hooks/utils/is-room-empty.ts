import { useSockets } from '../lib/use-sockets';
import { isValidSocket } from './is-valid-socket';

export function isRoomEmpty(room: string) {
	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (isValidSocket(socket) && socket.rooms.has(room)) {
			return false;
		}
	}

	return true;
}

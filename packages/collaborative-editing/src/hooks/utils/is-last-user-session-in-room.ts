import { useSockets } from '../modules/use-sockets';
import { RealtimeWebSocket } from '../types';
import { isValidSocket } from './is-valid-socket';

export function isLastUserSessionInRoom(client: RealtimeWebSocket, room: string) {
	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (
			isValidSocket(socket) &&
			socket.client.id === client.id &&
			socket.client.uid !== client.uid &&
			socket.client.rooms.has(room)
		) {
			return false;
		}
	}

	return true;
}

import { SavePayload } from '../../../../shared/types/events';
import { BroadcastSavePayload } from '../../../types';
import { isValidSocket } from '../../../utils/is-valid-socket';
import { useSockets } from '../../use-sockets';

export function broadcastSave(payload: BroadcastSavePayload) {
	const { room, origin } = payload;

	const sockets = useSockets();
	// Emit the update to all current room clients
	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.client.accountability.user === origin || socket.rooms.has(room) === false) {
			continue;
		}

		const message: SavePayload = { event: 'save', room };

		try {
			socket.client.send(JSON.stringify(message));
		} catch {
			// ignore
		}
	}
}

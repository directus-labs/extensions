import { SaveCommitPayload, SaveCommittedPayload, SaveConfirmPayload } from '../../../../shared/types/events';
import {
	BroadcastSaveCommittedPayload,
	BroadcastSaveConfirmedPayload,
	BroadcastSaveConfirmPayload,
} from '../../../types';
import { isValidSocket } from '../../../utils/is-valid-socket';
import { useRooms } from '../../use-rooms';
import { useSockets } from '../../use-sockets';

export function broadcastSaveConfirm(payload: BroadcastSaveConfirmPayload) {
	const { room, originId, data } = payload;

	const sockets = useSockets();
	// Emit the update to all current room clients
	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.rooms.has(room) === false) {
			continue;
		}

		const message: SaveConfirmPayload = { event: 'save:confirm', room, savedAt: data.savedAt, id: originId };

		try {
			socket.client.send(JSON.stringify(message));
		} catch {
			// ignore
		}
	}
}

export function broadcastSaveConfirmed(payload: BroadcastSaveConfirmedPayload) {
	const { room: roomName, originId, data } = payload;

	const rooms = useRooms();
	const sockets = useSockets();

	const room = rooms.get(roomName);

	if (!room) return;

	// Only process the node that has the saved state for this client
	if (!room.saves.has(payload.data.id)) return;

	const savedById = room.saves.get(payload.data.id)!;

	savedById.delete(originId);

	/**
	 * Send commit to all sockets that belong to the id, only the socket in the room with the save will commit.
	 * This should only apply to the save initiators session due to the savedAt data check
	 */
	if (savedById.size === 0) {
		for (const [, socket] of sockets) {
			if (!isValidSocket(socket) || socket.rooms.has(roomName) === false || socket.client.id !== data.id) continue;

			const payload: SaveCommitPayload = {
				event: 'save:commit',
				room: roomName,
			};

			try {
				socket.client.send(JSON.stringify(payload));
			} catch {
				// ignore
			}
		}

		room.saves.delete(payload.data.id);
	}
}

export function broadcastSaveCommitted(payload: BroadcastSaveCommittedPayload) {
	const { room } = payload;

	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.rooms.has(room) === false) continue;

		const payload: SaveCommittedPayload = {
			event: 'save:committed',
			room,
		};

		try {
			socket.client.send(JSON.stringify(payload));
		} catch {
			// ignore
		}
	}
}

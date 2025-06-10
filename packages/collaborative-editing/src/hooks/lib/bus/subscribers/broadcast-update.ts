import { UpdatePayload } from '../../../../shared/types/events';
import { BroadcastContext, BroadcastUpdatePayload } from '../../../types';
import { isValidSocket } from '../../../utils/is-valid-socket';
import { sanitizePayload } from '../../../utils/sanitize-payload';
import { useSockets } from '../../use-sockets';

export async function broadcastUpdate(payload: BroadcastUpdatePayload, ctx: BroadcastContext) {
	const { getSchema, services, database } = ctx;
	const { originUid, data, room } = payload;

	const schema = await getSchema();
	const sockets = useSockets();

	if (!data) {
		return;
	}

	// Emit the update to all current room clients if they have permission to access the field
	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.client.uid === originUid || socket.rooms.has(room) === false) {
			continue;
		}

		const socketSanitizedPayload = await sanitizePayload(socket.client.accountability, room, data, {
			database,
			schema,
			services,
		});

		// Do not send empty events
		if (socketSanitizedPayload === null) {
			continue;
		}

		const message: UpdatePayload = { event: 'update', update: socketSanitizedPayload, room };

		try {
			socket.client.send(JSON.stringify(message));
		} catch {
			// ignore
		}
	}
}

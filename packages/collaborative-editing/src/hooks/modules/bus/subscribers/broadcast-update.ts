import { UpdatePayload } from '../../../../shared/types/events';
import { BroadcastContext, BroadcastUpdatePayload } from '../../../types';
import { isValidSocket } from '../../../utils/is-valid-socket';
import { sanitizePayload } from '../../../utils/sanitize-payload';
import { useSockets } from '../../use-sockets';

export async function broadcastUpdate(payload: BroadcastUpdatePayload, ctx: BroadcastContext) {
	const { getSchema, services, database } = ctx;
	const { origin, data, room } = payload;

	const schema = await getSchema();
	const sockets = useSockets();

	if (!data) {
		return;
	}

	// Emit the update to all current room clients if they have permission to access the field
	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.client.uid === origin || socket.rooms.has(room) === false) {
			continue;
		}

		const socketSanitizedPayload = await sanitizePayload(socket.client.accountability, room, data, {
			database,
			schema,
			services,
		});

		if (socketSanitizedPayload === null) {
			// Do not send empty events
			console.log(`[realtime:update] Skipping sending event to ${socket.client.uid} as no sanitized payload`);

			continue;
		}

		const message: UpdatePayload = { event: 'update', update: socketSanitizedPayload };

		console.log(
			`[realtime:update] Event sent to user ${socket.client.accountability.user} with socket uid ${socket.client.uid}`,
		);

		try {
			socket.client.send(JSON.stringify(message));
		} catch (error) {
			console.log(error);
		}
	}
}

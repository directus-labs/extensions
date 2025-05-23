import { AwarenessFieldActivatePayload } from '../../../../shared/types/events';
import {
	BroadcastAwarenessFieldAddPayload,
	BroadcastAwarenessFieldRemovePayload,
	BroadcastContext,
} from '../../../types';
import { isValidSocket } from '../../../utils/is-valid-socket';
import { useRooms } from '../../use-rooms';
import { useSockets } from '../../use-sockets';

export async function broadcastFieldAwareness(
	payload: BroadcastAwarenessFieldAddPayload | BroadcastAwarenessFieldRemovePayload,
	ctx: BroadcastContext,
) {
	const { services, database, getSchema } = ctx;
	const { data, room, action } = payload;

	const schema = await getSchema();
	const sockets = useSockets();
	const rooms = useRooms();

	let message = { event: 'awareness', type: 'field', action, uid: data.id };

	if (action === 'add') {
		rooms.addField(room, data.id, data.field);
	} else {
		rooms.removeField(room, data.id);
	}

	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.rooms.has(room) === false) continue;

		if (payload.action === 'add') {
			const collection = payload.data.collection;
			const primaryKey = payload.data.primaryKey;
			const field = payload.data.field;

			message = {
				...message,
				collection,
				primaryKey,
				field,
			} as AwarenessFieldActivatePayload;

			// permission check
			if (field && collection && primaryKey) {
				try {
					await new services.ItemsService(collection, {
						knex: database,
						accountability: socket.client.accountability,
						schema,
					}).readOne(primaryKey, { fields: [field] });
				} catch {
					console.log(`[realtime:activate] Field awareness event skipped for ${socket.client.uid}`);
					continue;
				}
			}
		}

		console.log(`[realtime:awareness:field:${action}] Field awareness event sent to ${socket.client.uid}`);

		try {
			socket.client.send(JSON.stringify(message));
		} catch (error) {
			console.log(error);
		}
	}
}

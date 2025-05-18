import { ActivateMessage, AwarenessFieldActivatePayload } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import { Context, RealtimeWebSocket } from '../types';
import { isValidSocket } from '../utils/is-valid-socket';

export async function handleActivate(client: RealtimeWebSocket, message: Omit<ActivateMessage, 'type'>, ctx: Context) {
	const { getSchema, services, database: knex } = ctx;
	const sockets = useSockets();
	const rooms = useRooms();
	const schema = await getSchema();

	const { room, field, collection, primaryKey } = message;

	if (!room || !sockets.get(client.uid)?.rooms.has(message.room)) return;

	console.log(`[realtime:activate] Event received for field ${field} in room ${room}`);

	rooms.addField(room, client.id, field);

	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.rooms.has(room) === false) continue;

		const payload: AwarenessFieldActivatePayload = {
			event: 'awareness',
			type: 'field',
			action: 'add',
			uid: client.id,
			field,
			collection,
			primaryKey,
		};

		// permission check
		if (field && collection && primaryKey) {
			try {
				await new services.ItemsService(collection, {
					knex,
					accountability: socket.client.accountability,
					schema,
				}).readOne(primaryKey, { fields: [field] });
			} catch {
				console.log(`[realtime:activate] Field awareness event skipped for ${socket.client.uid}`);
				continue;
			}
		}

		console.log(`[realtime:activate] Field awareness event sent to ${socket.client.uid}`);

		try {
			socket.client.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

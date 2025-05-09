import { ActivateMessage, AwarenessFieldActivatePayload } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import { Context, DirectusWebsocket } from '../types';

export async function handleActivate(client: DirectusWebsocket, message: Omit<ActivateMessage, 'type'>, ctx: Context) {
	const { getSchema } = ctx;
	const sockets = useSockets();
	const rooms = useRooms();
	const schema = await getSchema();

	const { room, field, collection, primaryKey } = message;

	console.log(`[realtime:activate] Event received for field ${field} in room ${room}`);

	rooms.addField(room, client.id, field);

	for (const [, socket] of sockets) {
		if (socket.rooms.has(room) === false) continue;

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
				await new ctx.services.ItemsService(collection, {
					knex: ctx.database,
					accountability: socket.accountability,
					schema,
				}).readOne(primaryKey, { fields: [field] });
			} catch {
				console.log(`[realtime:activate] Field awareness event skipped for ${socket.uid}`);
				continue;
			}
		}

		console.log(`[realtime:activate] Field awareness event sent to ${socket.uid}`);

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

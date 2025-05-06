import { ActivateMessage, AwarenessFieldActivatePayload } from '../../types/events';
import { Context, DirectusWebsocket } from '../types';
import { useSockets } from '../utils/use-sockets';

export async function handleActivate(client: DirectusWebsocket, message: ActivateMessage, ctx: Context) {
	const sockets = useSockets();
	const schema = await ctx.getSchema();

	const { room, field } = message;

	console.log(`${client.uid} awareness added for ${field} in room ${room}`);

	const [collection, primaryKey] = room.split(':');

	for (const socket of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(room) === false) continue;

		const payload: AwarenessFieldActivatePayload = {
			event: 'awareness',
			type: 'field',
			action: 'add',
			uid: client.uid,
			field,
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
				// console.error(e);
				console.log(`Skipping awareness update, no permission to access ${field}`);
				// error = no permission
				continue;
			}
		}

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

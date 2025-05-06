import * as Y from 'yjs';
import type { UpdateMessage, UpdatePayload } from '../../types/events';
import type { Context, DirectusWebsocket } from '../types';
import { useRooms } from '../utils/use-rooms';
import { useSockets } from '../utils/use-sockets';

export async function handleUpdate(client: DirectusWebsocket, message: UpdateMessage, ctx: Context) {
	const sockets = useSockets();
	const rooms = useRooms();
	const schema = await ctx.getSchema();

	const { room: roomName, field } = message;

	console.log(`${client.uid} updated ${field} in room ${roomName}`);

	const [collection, primaryKey] = roomName.split(':');

	const room = rooms.get(roomName);

	if (!room) return;

	// apply update to room doc
	const doc = room.doc;
	console.log(`applying update to room ${roomName} doc id ${doc.clientID}`);
	Y.applyUpdate(doc, Buffer.from(message.update, 'base64'));

	for (const [, socket] of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(roomName) === false) continue;

		const payload: UpdatePayload = { event: 'update', update: message.update };

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
				console.log(`Skipping update payload, no permission to access ${field}`);
				// error = no permission
				continue;
			}
		}

		console.log(`sending update payload to ${socket.uid} for user ${socket.accountability?.user}`);

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

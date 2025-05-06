import * as Y from 'yjs';
import type { UpdateMessage, UpdatePayload } from '../../types/events';
import type { Context, DirectusWebsocket } from '../types';
import { useDocs } from '../utils/use-docs';
import { useSockets } from '../utils/use-sockets';

export async function handleUpdate(client: DirectusWebsocket, message: UpdateMessage, ctx: Context) {
	const sockets = useSockets();
	const docs = useDocs();
	const schema = await ctx.getSchema();

	const { room, field } = message;

	console.log(`${client.uid} updated ${field} in room ${room}`);

	const [collection, primaryKey] = room.split(':');

	// apply update to room doc
	const doc = docs.get(room)!;
	if (doc) {
		console.log(`applying update to room ${room} doc id ${doc.clientID}`);
		Y.applyUpdate(doc, Buffer.from(message.update, 'base64'));
	}

	for (const socket of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(room) === false) continue;

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

		console.log(`sending update payload to ${client.uid}`);

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

import * as Y from 'yjs';
import { Context, DirectusWebsocket, WebsocketMessage } from '../types';
import { useDocs } from '../utils/use-docs';
import { useSockets } from '../utils/use-sockets';

export interface HandleUpdatePayload extends WebsocketMessage {
	type: 'update';
	collection: string;
	primaryKey: string;
	field: string;
	update: string;
}

export async function handleUpdate(client: DirectusWebsocket, payload: HandleUpdatePayload, ctx: Context) {
	const sockets = useSockets();
	const docs = useDocs();
	const schema = await ctx.getSchema();

	const { collection, primaryKey, field } = payload;

	console.log(`${client.uid} updated ${field} in ${collection} with pk ${primaryKey}`);

	// if no room provided default to first room in the set
	const room = collection + ':' + primaryKey;

	if (!room) return;

	// apply update to room doc
	const doc = docs.get(room)!;
	if (doc) {
		console.log(`applying update to room ${room} doc id ${doc.clientID}`);
		Y.applyUpdate(doc, Buffer.from(payload.update, 'base64'));
	}

	for (const socket of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(room) === false) continue;

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
			socket.send(JSON.stringify({ type: 'update', update: payload.update }));
		} catch (error) {
			console.log(error);
		}
	}
}

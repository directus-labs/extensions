import * as Y from 'yjs';
import type { UpdateMessage, UpdatePayload } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import type { Context, DirectusWebsocket } from '../types';

export async function handleUpdate(client: DirectusWebsocket, message: Omit<UpdateMessage, 'type'>, ctx: Context) {
	const { services, database: knex, getSchema } = ctx;
	const rooms = useRooms();

	const { room: roomName } = message;

	const [collection, primaryKey] = roomName.split(':');

	if (!collection || !primaryKey) return;

	const room = rooms.get(roomName);

	if (!room) return;

	console.log(`[realtime:update] Event received from client ${client.uid} in room ${roomName}`);

	const update = Buffer.from(message.update, 'base64');

	/**
	 * This dummy document is used to validate updates without relying on trusting the client to indicate which field has changed.
	 * Since the payload may contain updates to multiple fields, we reject the entire update if any field is not permitted.
	 *
	 * Currently, the frontend is expected to send only one field per update.
	 * Therefor discarding the whole update when an invalid field is provided should not cause problems.
	 *
	 * A new dummy document is created for each update to avoid race conditions with a shared global instance.
	 */

	const dummyDoc = new Y.Doc();

	/**
	 *  Apply initial values from global doc, it ensures subsequent update events are based on existing values in the doc
	 *  Done before observe to ensure we dont catch the event
	 */
	Y.applyUpdate(dummyDoc, Y.encodeStateAsUpdate(room.doc));

	const dummyDocMap = dummyDoc.getMap(roomName);

	dummyDocMap.observe(async (event) => {
		const fields: string[] = [];
		const sockets = useSockets();
		const schema = await getSchema();

		// Track all fields changed in the payload
		for (const field of event.keysChanged) {
			console.log(`[realtime:update] Field ${field} was changed`);

			// ignore deletes
			if (!dummyDocMap.has(field)) continue;

			fields.push(field);
		}

		// Ensure client is able to access the changed fields for the given record
		try {
			await new services.ItemsService(collection, {
				knex,
				accountability: client.accountability,
				schema,
			}).readOne(primaryKey, { fields });
		} catch {
			console.log(
				`[realtime:update] Skipping update event for user ${client.accountability.user} with client uid ${client.uid}`,
			);

			return;
		}

		if (fields.length === 0) {
			console.log('[realtime:update] Skipping update event due to no fields changed');
			dummyDoc.destroy();
			return;
		}

		// Apply update to room doc, this will ensure its shared globally for anyone who joins the room
		const doc = room!.doc;
		console.log(`[realtime:update] Applying update to doc ${doc.clientID}`);
		Y.applyUpdate(doc, update);

		// Emit the update to all current room clients if they have permission to access the field
		for (const [, socket] of sockets) {
			if (client.uid === socket.uid || socket.rooms.has(roomName) === false) continue;

			const payload: UpdatePayload = { event: 'update', update: message.update };

			try {
				await new services.ItemsService(collection, {
					knex,
					accountability: socket.accountability,
					schema,
				}).readOne(primaryKey, { fields });
			} catch {
				console.log(`[realtime:update] Event skipped for ${socket.uid}`);
				continue;
			}

			console.log(`[realtime:update] Event sent to user ${socket.accountability.user} with socket uid ${socket.uid}`);

			try {
				socket.send(JSON.stringify(payload));
			} catch (error) {
				console.log(error);
			}
		}

		// cleanup
		dummyDoc.destroy();
	});

	Y.applyUpdate(dummyDoc, update);
}

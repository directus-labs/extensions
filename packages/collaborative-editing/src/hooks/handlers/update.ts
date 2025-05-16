import * as Y from 'yjs';
import type { UpdateMessage, UpdatePayload } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import type { Context, DirectusWebsocket } from '../types';
import { isValidSocket } from '../utils/is-valid-socket';
import { sanitizePayload } from '../utils/sanitize-payload';

export async function handleUpdate(client: DirectusWebsocket, message: Omit<UpdateMessage, 'type'>, ctx: Context) {
	const sockets = useSockets();
	const rooms = useRooms();
	const { getSchema, services, database } = ctx;

	const { room: roomName } = message;

	const [collection, primaryKey] = roomName.split(':');

	if (!collection || !primaryKey) return;

	const room = rooms.get(roomName);

	if (!room) return;

	console.log(`[realtime:update] Event received from client ${client.uid} in room ${roomName}`);

	const schema = await getSchema();

	const sanitizedPayload = await sanitizePayload(client, roomName, message.update, { database, schema, services });

	if (!sanitizedPayload) {
		console.log(`[realtime:update] Skipping update to doc ${room.doc.clientID} as no sanitized payload`);
		return;
	}

	// Apply update to room doc, this will ensure its shared globally for anyone who joins the room
	console.log(`[realtime:update] Applying update to doc ${room.doc.clientID}`);
	const changeDoc = new Y.Doc();
	Y.applyUpdate(changeDoc, Y.encodeStateAsUpdate(room.doc));

	for (const field in sanitizedPayload) {
		if (Object.prototype.hasOwnProperty.call(sanitizedPayload, field)) {
			changeDoc.getMap(roomName).set(field, sanitizedPayload[field]);
		}
	}
	Y.applyUpdate(room.doc, Y.encodeStateAsUpdate(changeDoc));

	const updatePayload: Record<string, unknown> = {};
	for (const field in sanitizedPayload) {
		if (Object.prototype.hasOwnProperty.call(sanitizedPayload, field)) {
			updatePayload[field] = room.doc.getMap(roomName).get(field);
		}
	}

	// Emit the update to all current room clients if they have permission to access the field
	for (const [, socket] of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(roomName) === false || !isValidSocket(socket)) continue;

		const socketSanitizedPayload = await sanitizePayload(socket, roomName, updatePayload, {
			database,
			schema,
			services,
		});

		const payload: UpdatePayload = { event: 'update', update: socketSanitizedPayload };

		console.log(`[realtime:update] Event sent to user ${socket.accountability.user} with socket uid ${socket.uid}`);

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

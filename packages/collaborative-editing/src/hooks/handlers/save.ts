import { Accountability, SchemaOverview } from '@directus/types';
import * as Y from 'yjs';
import { SavePayload } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import { Context } from '../types';
import { isValidSocket } from '../utils/is-valid-socket';
import { sanitizePayload } from '../utils/sanitize-payload';

interface HandleSaveMeta {
	event: string;
	payload: Record<string, unknown>;
	keys: (number | string)[];
	collection: string;
}

export async function handleSave(
	meta: Record<string, unknown>,
	ctx: Pick<Context, 'database' | 'services'> & {
		schema: SchemaOverview | null;
		accountability: Accountability | null;
	},
) {
	const sockets = useSockets();
	const rooms = useRooms();

	const { payload: savedPayload, keys, collection } = meta as unknown as HandleSaveMeta;
	const { database, schema, accountability, services } = ctx;

	if (!schema) {
		return;
	}

	console.log(`[realtime:save] Event received for ${collection}`);

	for (const key of keys) {
		const roomName = `${collection}:${key}`;
		const room = rooms.get(roomName);

		if (!room) {
			continue;
		}

		console.log(`[realtime:save] Applying update to doc ${room.doc.clientID}`);
		const changeDoc = new Y.Doc();
		Y.applyUpdate(changeDoc, Y.encodeStateAsUpdate(room.doc));

		for (const field of Object.keys(savedPayload)) {
			changeDoc.getMap(roomName).set(field, savedPayload[field]);
		}
		Y.applyUpdate(room.doc, Y.encodeStateAsUpdate(changeDoc));

		const savePayload: Record<string, unknown> = {};
		for (const field of Object.keys(savedPayload)) {
			savePayload[field] = room.doc.getMap(roomName).get(field);
		}

		// Emit the update to all current room clients if they have permission to access the field
		for (const [, socket] of sockets) {
			if (!isValidSocket(socket) || socket.rooms.has(roomName) === false) {
				continue;
			}

			if (accountability?.user === socket.client.accountability.user) {
				continue;
			}

			const socketSanitizedPayload = await sanitizePayload(socket.client, roomName, savePayload, {
				database,
				schema,
				services,
			});

			if (socketSanitizedPayload === null) {
				// Do not send empty events
				console.log(`[realtime:save] Skipping sending event to ${socket.client.uid} as no sanitized payload`);

				continue;
			}

			const payload: SavePayload = { event: 'save', save: socketSanitizedPayload };

			console.log(
				`[realtime:save] Event sent to user ${socket.client.accountability.user} with socket uid ${socket.client.uid}`,
			);

			try {
				socket.client.send(JSON.stringify(payload));
			} catch (error) {
				console.log(error);
			}
		}
	}
}

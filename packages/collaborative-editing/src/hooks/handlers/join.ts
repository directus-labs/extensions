import { entries } from 'lodash-es';
import * as Y from 'yjs';
import type { AwarenessUserAddPayload, JoinMessage, SyncPayload } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import type { Context, DirectusWebsocket } from '../types';
import { getSockerUser } from '../utils/get-socket-user';

export async function handleJoin(client: DirectusWebsocket, message: Omit<JoinMessage, 'type'>, ctx: Context) {
	const { getSchema, services, database } = ctx;
	const rooms = useRooms();
	const sockets = useSockets();
	const schema = await getSchema();

	console.log(`added room: ${message.room}`);
	client.rooms.add(message.room);

	let room = rooms.get(message.room);

	if (!room) {
		console.log(`created doc for room ${message.room}`);
		room = rooms.add(message.room);
	}

	rooms.addUser(message.room, client.uid);

	// ====
	// awareness
	for (const [, socket] of sockets) {
		if (socket.rooms.has(message.room) === false) continue;

		const payload: AwarenessUserAddPayload = {
			event: 'awareness',
			type: 'user',
			action: 'add',
			...(await getSockerUser(client, { accountability: socket.accountability, schema, database, services })),
		};

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}

	// ====
	// state sync
	const doc = room.doc;

	// remove forbidden fields
	const sync = new Y.Doc();
	const [collection, primaryKey] = message.room.split(':');
	const updates = sync.getMap(message.room);
	const currentFields = doc.getMap(message.room).toJSON();
	for (const [field, value] of entries(currentFields)) {
		// permission check
		if (field && collection && primaryKey) {
			try {
				await new ctx.services.ItemsService(collection, {
					knex: ctx.database,
					accountability: client.accountability,
					schema,
				}).readOne(primaryKey, { fields: [field] });

				updates.set(field, value);
			} catch {
				// console.error(e);
				console.log(`excluding field ${field} from sync as client ${client.id} has no permission`);
				// error = no permission
				continue;
			}
		}
	}

	const payload: SyncPayload = {
		event: 'sync',
		state: Buffer.from(Y.encodeStateAsUpdate(sync)).toString('base64'),
		users: [],
		fields: [],
	};

	const users = new Map();
	for (const uid of room.users.keys()) {
		const socket = sockets.get(uid);
		if (!socket) {
			continue;
		}

		if (users.has(socket.id)) {
			// dont reprocess user
			continue;
		}

		const userPayload = await getSockerUser(socket, {
			schema,
			database,
			services,
			accountability: client.accountability,
		});

		users.set(socket.id, userPayload);
	}

	payload.users = Array.from(users.values());

	for (const [id, field] of room.fields.entries()) {
		try {
			await new ctx.services.ItemsService(collection, {
				knex: ctx.database,
				accountability: client.accountability,
				schema,
			}).readOne(primaryKey, { fields: [field] });

			payload.fields.push({
				field,
				uid: id,
				collection,
				primaryKey,
			});
		} catch {
			// console.error(e);
			console.log(`Skipping awareness payload update, no permission to access ${field}`);
			// error = no permission
			continue;
		}
	}

	try {
		client.send(JSON.stringify(payload));
	} catch (error) {
		console.log(error);
	}
}

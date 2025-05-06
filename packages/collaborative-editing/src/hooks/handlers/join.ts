import { entries } from 'lodash-es';
import * as Y from 'yjs';
import type { AwarenessUserAddPayload, JoinMessage, SyncPayload } from '../../types/events';
import type { Context, DirectusWebsocket } from '../types';
import { useRooms } from '../utils/use-rooms';
import { useSockets } from '../utils/use-sockets';

export async function handleJoin(client: DirectusWebsocket, message: JoinMessage, ctx: Context) {
	const rooms = useRooms();
	const sockets = useSockets();
	const schema = await ctx.getSchema();

	console.log(`added room: ${message.room}`);
	client.rooms.add(message.room);

	let room = rooms.get(message.room);

	if (!room) {
		console.log(`created doc for room ${message.room}`);
		room = rooms.add(message.room);
	}

	rooms.addUser(message.room, client.uid, client.color);

	// ====
	// awareness
	for (const [, socket] of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(message.room) === false) continue;

		let payload: AwarenessUserAddPayload = {
			event: 'awareness',
			type: 'user',
			action: 'add',
			uid: client.uid,
			color: client.color,
		};

		try {
			const dbUser = await new ctx.services.UsersService({
				knex: ctx.database,
				accountability: socket.accountability,
				schema,
			}).readOne(client.accountability?.user, {
				fields: ['id', 'first_name', 'last_name', 'avatar'],
			});

			payload = {
				...payload,
				...dbUser,
			};
		} catch {
			// console.error(e);
			console.log(`Skipping awareness payload update, no permission to access ${client.accountability?.user}`);
			// error = no permission
			continue;
		}

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
				console.log(`excluding field ${field} from sync as client ${client.uid} has no permission`);
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

	for (const [uid, color] of room.users.entries()) {
		let userPayload = {
			uid,
			color,
		};

		const socket = sockets.get(uid);
		if (!socket) {
			continue;
		}

		try {
			const dbUser = await new ctx.services.UsersService({
				knex: ctx.database,
				accountability: client.accountability,
				schema,
			}).readOne(socket.accountability?.user, {
				fields: ['id', 'first_name', 'last_name', 'avatar'],
			});

			userPayload = {
				...userPayload,
				...dbUser,
			};
		} catch {
			// console.error(e);
			console.log(`Skipping awareness payload update, no permission to access ${client.accountability?.user}`);
			// error = no permission
			continue;
		}

		payload.users.push(userPayload);
	}

	for (const [uid, field] of room.fields.entries()) {
		try {
			await new ctx.services.ItemsService(collection, {
				knex: ctx.database,
				accountability: client.accountability,
				schema,
			}).readOne(primaryKey, { fields: [field] });

			payload.fields.push({
				field,
				uid,
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

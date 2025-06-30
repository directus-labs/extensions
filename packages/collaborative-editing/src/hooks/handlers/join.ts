import type { JoinMessage, SyncPayload } from '../../shared/types/events';
import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../lib/bus';
import { useRooms } from '../lib/use-rooms';
import { useSockets } from '../lib/use-sockets';
import type { BroadcastPayload, Context, RealtimeWebSocket } from '../types';
import { getSocketUser } from '../utils/get-socket-user';
import { sanitizePayload } from '../utils/sanitize-payload';

export async function handleJoin(client: RealtimeWebSocket, message: Omit<JoinMessage, 'type'>, ctx: Context) {
	const { getSchema, services, database, env } = ctx;
	const { room: roomName } = message;

	const rooms = useRooms();
	const sockets = useSockets();
	const schema = await getSchema();
	const bus = useBus(env);

	sockets.get(client.uid)?.rooms.add(roomName);

	let room = rooms.get(roomName);

	if (!room) {
		room = rooms.add(roomName);
	}

	rooms.addUser(roomName, { uid: client.uid, id: client.id, userId: client.accountability.user!, color: client.color });

	// ====
	// awareness
	const broadcast: BroadcastPayload = {
		type: 'awareness-user',
		room: roomName,
		action: 'add',
		userId: client.accountability.user!,
		data: {
			id: client.id,
			uid: client.uid,
			color: client.color,
		},
	};
	bus.publish(BROADCAST_CHANNEL, broadcast);

	// ====
	// state sync
	const [collection, primaryKey] = roomName.split(':');

	const sanitizedPayload = await sanitizePayload(client.accountability, roomName, room.doc.getMap(roomName).toJSON(), {
		database,
		schema,
		services,
	});

	const payload: SyncPayload = {
		event: 'sync',
		room: roomName,
		state: sanitizedPayload,
		users: [],
		fields: [],
	};

	const users = new Map();
	for await (const [, user] of room.users) {
		if (users.has(user.id)) {
			// dont reprocess user
			continue;
		}

		users.set(user.id, {
			uid: user.id,
			color: user.color,
			...(await getSocketUser(user.userId, {
				schema,
				database,
				services,
				accountability: client.accountability,
			})),
		});
	}

	payload.users = Array.from(users.values());

	for await (const [id, field] of room.fields.entries()) {
		try {
			await new services.ItemsService(collection, {
				knex: database,
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
			continue;
		}
	}

	try {
		client.send(JSON.stringify(payload));
	} catch {
		// ignore
	}
}

import type { UpdateMessage } from '../../shared/types/events';
import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../lib/bus';
import { useRooms } from '../lib/use-rooms';
import { useSockets } from '../lib/use-sockets';
import type { BroadcastPayload, Context, RealtimeWebSocket } from '../types';
import { sanitizePayload } from '../utils/sanitize-payload';

export async function handleUpdate(client: RealtimeWebSocket, message: Omit<UpdateMessage, 'type'>, ctx: Context) {
	const { getSchema, services, database, env } = ctx;
	const { room: roomName } = message;

	const sockets = useSockets();
	const rooms = useRooms();
	const bus = useBus(env);

	const [collection, primaryKey] = roomName.split(':');

	if (!collection || !primaryKey) return;

	const room = rooms.get(roomName);

	if (!room || !sockets.get(client.uid)?.rooms.has(roomName)) return;

	const schema = await getSchema();

	const sanitizedPayload = await sanitizePayload(client.accountability, roomName, message.update, {
		database,
		schema,
		services,
	});

	if (!sanitizedPayload) {
		return;
	}

	const broadcast: BroadcastPayload = {
		type: 'room-doc',
		room: roomName,
		origin: client.uid,
		data: sanitizedPayload,
	};
	bus.publish(BROADCAST_CHANNEL, broadcast);
}

import { ActivateMessage } from '../../shared/types/events';
import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../lib/bus';
import { useRooms } from '../lib/use-rooms';
import { useSockets } from '../lib/use-sockets';
import { BroadcastPayload, Context, RealtimeWebSocket } from '../types';

export async function handleActivate(client: RealtimeWebSocket, message: Omit<ActivateMessage, 'type'>, ctx: Context) {
	const { env } = ctx;
	const { room, field, collection, primaryKey } = message;

	const sockets = useSockets();
	const rooms = useRooms();
	const bus = useBus(env);

	if (!room || !sockets.get(client.uid)?.rooms.has(message.room)) return;

	rooms.addField(room, client.id, field);

	const broadcast: BroadcastPayload = {
		type: 'awareness-field',
		room,
		action: 'add',
		data: {
			id: client.id,
			collection,
			primaryKey,
			field,
		},
	};
	bus.publish(BROADCAST_CHANNEL, broadcast);
}

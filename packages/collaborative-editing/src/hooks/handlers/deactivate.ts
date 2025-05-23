import { DeactivateMessage } from '../../types/events';
import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../modules/bus';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import { BroadcastPayload, Context, RealtimeWebSocket } from '../types';

export async function handleDeactivate(
	client: RealtimeWebSocket,
	message: Omit<DeactivateMessage, 'type'>,
	ctx: Context,
) {
	const { env } = ctx;
	const { room } = message;

	const sockets = useSockets();
	const rooms = useRooms();
	const bus = useBus(env);

	console.log(`[realtime:deactivate] Event received for ${client.uid} in room ${room}`);

	if (!room || !sockets.get(client.uid)?.rooms.has(message.room)) return;

	rooms.removeField(room, client.id);

	const broadcast: BroadcastPayload = {
		type: 'awareness-field',
		room,
		action: 'remove',
		data: {
			id: client.id,
		},
	};
	bus.publish(BROADCAST_CHANNEL, broadcast);
}

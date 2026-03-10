import { DeactivateMessage } from '../../shared/types/events';
import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../lib/bus';
import { useRooms } from '../lib/use-rooms';
import { useSockets } from '../lib/use-sockets';
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

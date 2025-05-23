import type { LeaveMessage } from '../../shared/types/events';
import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../lib/bus';
import { useRooms } from '../lib/use-rooms';
import { useSockets } from '../lib/use-sockets';
import type { BroadcastPayload, Context, RealtimeWebSocket } from '../types';
import { isLastUserSessionInRoom } from '../utils/is-last-user-session-in-room';

export async function handleLeave(client: RealtimeWebSocket, message: Omit<LeaveMessage, 'type'>, ctx: Context) {
	const { env } = ctx;
	const { room } = message;

	const rooms = useRooms();
	const sockets = useSockets();
	const bus = useBus(env);

	console.log(`[realtime:leave] Event received for client ${client.uid} in room ${room}`);

	sockets.get(client.uid)?.rooms.delete(room);

	rooms.removeUser(room, client.uid);

	// Do not send awareness if a session (tab) is still open
	if (!isLastUserSessionInRoom(client, room)) {
		console.log(`[realtime:leave] User awareness event skipped due to other sessions being active`);
		return;
	}

	const broadcast: BroadcastPayload = {
		type: 'awareness-user',
		room,
		action: 'remove',
		origin: client.id,
		data: {
			id: client.id,
			uid: client.uid,
		},
	};
	bus.publish(BROADCAST_CHANNEL, broadcast);
}

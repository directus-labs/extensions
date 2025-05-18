import { AwarenessFieldDeactivatePayload, DeactivateMessage } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import { RealtimeWebSocket } from '../types';
import { isValidSocket } from '../utils/is-valid-socket';

export async function handleDeactivate(client: RealtimeWebSocket, message: Omit<DeactivateMessage, 'type'>) {
	const sockets = useSockets();
	const rooms = useRooms();

	const { room } = message;

	console.log(`[realtime:deactivate] Event received for ${client.uid} in room ${room}`);

	if (!room || !sockets.get(client.uid)?.rooms.has(message.room)) return;

	rooms.removeField(room, client.id);

	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.rooms.has(room) === false) continue;

		const payload: AwarenessFieldDeactivatePayload = {
			event: 'awareness',
			type: 'field',
			action: 'remove',
			uid: client.id,
		};

		console.log(`[realtime:activate] Field awareness event sent to ${socket.client.uid}`);

		try {
			socket.client.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

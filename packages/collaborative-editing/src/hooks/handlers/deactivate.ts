import { AwarenessFieldDeactivatePayload, DeactivateMessage } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import { DirectusWebsocket } from '../types';

export async function handleDeactivate(client: DirectusWebsocket, message: Omit<DeactivateMessage, 'type'>) {
	const sockets = useSockets();
	const rooms = useRooms();

	const { room } = message;

	console.log(`[realtime:deactivate] Event received for ${client.uid} in room ${room}`);

	if (!room) return;

	rooms.removeField(room, client.id);

	for (const [, socket] of sockets) {
		if (socket.rooms.has(room) === false) continue;

		const payload: AwarenessFieldDeactivatePayload = {
			event: 'awareness',
			type: 'field',
			action: 'remove',
			uid: client.id,
		};

		console.log(`[realtime:activate] Field awareness event sent to ${socket.uid}`);

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

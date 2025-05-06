import { AwarenessFieldDeactivatePayload, DeactivateMessage } from '../../types/events';
import { DirectusWebsocket } from '../types';
import { useRooms } from '../utils/use-rooms';
import { useSockets } from '../utils/use-sockets';

export async function handleDeactivate(client: DirectusWebsocket, message: DeactivateMessage) {
	const sockets = useSockets();
	const rooms = useRooms();

	const { room } = message;

	console.log(`${client.uid} removed awareness field awareness in ${room}`);

	if (!room) return;

	rooms.removeField(room, client.uid);

	for (const [, socket] of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(room) === false) continue;

		const payload: AwarenessFieldDeactivatePayload = {
			event: 'awareness',
			type: 'field',
			action: 'remove',
			uid: client.uid,
		};

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

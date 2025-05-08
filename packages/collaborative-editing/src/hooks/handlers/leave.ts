import type { AwarenessUserRemovePayload, LeaveMessage } from '../../types/events';
import type { DirectusWebsocket } from '../types';
import { useRooms } from '../utils/use-rooms';
import { useSockets } from '../utils/use-sockets';

export async function handleLeave(client: DirectusWebsocket, message: LeaveMessage) {
	const rooms = useRooms();
	const sockets = useSockets();

	console.log(`removed room: ${message.room}`);
	client.rooms.delete(message.room);

	rooms.removeUser(message.room, client.id);

	for (const [, socket] of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(message.room) === false) continue;

		const payload: AwarenessUserRemovePayload = { event: 'awareness', type: 'user', action: 'remove', uid: client.id };

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}

	// delete doc if they are last client in the room
	if (isRoomEmpty(message.room)) {
		rooms.remove(message.room);
	}
}

function isRoomEmpty(room: string) {
	const sockets = useSockets();

	for (const [, socket] of sockets) {
		if (socket.rooms.has(room)) {
			return false;
		}
	}

	return true;
}

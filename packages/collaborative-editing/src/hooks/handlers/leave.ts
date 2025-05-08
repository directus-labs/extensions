import type { AwarenessUserRemovePayload, LeaveMessage } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import type { DirectusWebsocket } from '../types';
import { isLastUserSocket } from '../utils/is-last-socket';
import { isRoomEmpty } from '../utils/is-room-empty';

export async function handleLeave(client: DirectusWebsocket, message: LeaveMessage) {
	const rooms = useRooms();
	const sockets = useSockets();

	console.log(`removed room: ${message.room}`);
	client.rooms.delete(message.room);

	rooms.removeUser(message.room, client.uid);

	// Do not send awareness if a session (tab) is still open
	if (!isLastUserSocket(client)) {
		return;
	}

	for (const [, socket] of sockets) {
		if (client.id === socket.id || socket.rooms.has(message.room) === false) continue;

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

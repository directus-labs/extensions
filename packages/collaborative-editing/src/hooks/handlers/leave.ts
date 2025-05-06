import type { AwarenessUserRemovePayload, LeaveMessage } from '../../types/events';
import type { DirectusWebsocket } from '../types';
import { useDocs } from '../utils/use-docs';
import { useSockets } from '../utils/use-sockets';

export async function handleLeave(client: DirectusWebsocket, message: LeaveMessage) {
	const docs = useDocs();
	const sockets = useSockets();

	console.log(`removed room: ${message.room}`);
	client.rooms.delete(message.room);

	// delete doc if they are last client in the room
	if (isRoomEmpty(message.room)) {
		docs.remove(message.room);
	}

	for (const socket of sockets) {
		if (client.uid === socket.uid || socket.rooms.has(message.room) === false) continue;

		const payload: AwarenessUserRemovePayload = { event: 'awareness', type: 'user', action: 'remove', uid: client.uid };

		try {
			socket.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}
}

function isRoomEmpty(room: string) {
	const sockets = useSockets();

	for (const socket of sockets) {
		if (socket.rooms.has(room)) {
			return false;
		}
	}

	return true;
}

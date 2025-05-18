import type { AwarenessUserRemovePayload, LeaveMessage } from '../../types/events';
import { useRooms } from '../modules/use-rooms';
import { useSockets } from '../modules/use-sockets';
import type { RealtimeWebSocket } from '../types';
import { isLastUserSocket } from '../utils/is-last-socket';
import { isRoomEmpty } from '../utils/is-room-empty';
import { isValidSocket } from '../utils/is-valid-socket';

export async function handleLeave(client: RealtimeWebSocket, message: Omit<LeaveMessage, 'type'>) {
	const rooms = useRooms();
	const sockets = useSockets();

	console.log(`[realtime:leave] Event received for client ${client.uid} in room ${message.room}`);

	sockets.get(client.uid)?.rooms.delete(message.room);

	rooms.removeUser(message.room, client.uid);

	// Do not send awareness if a session (tab) is still open
	if (!isLastUserSocket(client)) {
		console.log(`[realtime:leave] User awareness event skipped due to other sessions being active`);
		return;
	}

	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || client.id === socket.client.id || socket.rooms.has(message.room) === false) continue;

		const payload: AwarenessUserRemovePayload = { event: 'awareness', type: 'user', action: 'remove', uid: client.id };

		console.log(`[realtime:leave] User awareness event sent to ${socket.client.uid}`);

		try {
			socket.client.send(JSON.stringify(payload));
		} catch (error) {
			console.log(error);
		}
	}

	// delete doc if they are last client in the room
	if (isRoomEmpty(message.room)) {
		console.log(`[realtime:leave] Last client in the room has left, removing room instance`);

		rooms.delete(message.room);
	}
}

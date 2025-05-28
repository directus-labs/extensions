import { AwarenessUserAddPayload } from '../../../../shared/types/events';
import {
	BroadcastAwarenessUserAddPayload,
	BroadcastAwarenessUserRemovePayload,
	BroadcastContext,
} from '../../../types';
import { getSocketUser } from '../../../utils/get-socket-user';
import { isRoomEmpty } from '../../../utils/is-room-empty';
import { isValidSocket } from '../../../utils/is-valid-socket';
import { useRooms } from '../../use-rooms';
import { useSockets } from '../../use-sockets';

export async function broadcastUserAwareness(
	payload: BroadcastAwarenessUserAddPayload | BroadcastAwarenessUserRemovePayload,
	ctx: BroadcastContext,
) {
	const { database, services, getSchema } = ctx;
	const { data, room, action } = payload;

	const sockets = useSockets();
	const rooms = useRooms();
	const schema = await getSchema();

	let message = {
		event: 'awareness',
		type: 'user',
		action,
		uid: data.id,
		room,
	};

	if (action === 'add') {
		rooms.addUser(room, { uid: data.uid, id: data.id, userId: payload.userId, color: data.color });
	} else {
		rooms.removeUser(room, data.uid);
	}

	for (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.rooms.has(room) === false) continue;

		if (payload.action === 'remove' && socket.client.id === payload.origin) continue;

		if (payload.action === 'add') {
			message = {
				...message,
				color: payload.data.color,
				...(await getSocketUser(payload.userId, {
					accountability: socket.client.accountability,
					schema,
					database,
					services,
				})),
			} as AwarenessUserAddPayload;
		}

		try {
			socket.client.send(JSON.stringify(message));
		} catch {
			// ignore
		}
	}

	if (action === 'remove') {
		// delete doc if they are last client in the room
		if (isRoomEmpty(room)) {
			rooms.delete(room);
		}
	}
}

import { AwarenessUserAddPayload } from '../../../../shared/types/events';
import { BROADCAST_CHANNEL } from '../../../constants';
import {
	BroadcastAwarenessUserAddPayload,
	BroadcastAwarenessUserRemovePayload,
	BroadcastContext,
	BroadcastPayload,
} from '../../../types';
import { getSocketUser } from '../../../utils/get-socket-user';
import { isRoomEmpty } from '../../../utils/is-room-empty';
import { isValidSocket } from '../../../utils/is-valid-socket';
import { useRooms } from '../../use-rooms';
import { useSockets } from '../../use-sockets';
import { useBus } from '../use-bus';

export async function broadcastUserAwareness(
	payload: BroadcastAwarenessUserAddPayload | BroadcastAwarenessUserRemovePayload,
	ctx: BroadcastContext,
) {
	const { database, services, getSchema, env } = ctx;
	const { data, room, action } = payload;

	const sockets = useSockets();
	const rooms = useRooms();
	const bus = useBus(env);
	const schema = await getSchema();

	if (action === 'add') {
		rooms.addUser(room, { uid: data.uid, id: data.id, userId: payload.userId, color: data.color });
	} else {
		rooms.removeUser(room, data.uid);

		// Simulate confirmation when user leaves to ensure we dont hang on the missing confirmation
		const saves = rooms.get(room)?.saves;

		if (saves) {
			for (const [clientId] of saves) {
				const broadcast: BroadcastPayload = {
					type: 'save:confirmed',
					room,
					originId: data.id,
					data: {
						id: clientId,
					},
				};
				bus.publish(BROADCAST_CHANNEL, broadcast);
			}
		}
	}

	for await (const [, socket] of sockets) {
		if (!isValidSocket(socket) || socket.rooms.has(room) === false) continue;

		if (payload.action === 'remove' && socket.client.id === payload.originId) continue;

		let message = {
			event: 'awareness',
			type: 'user',
			action,
			uid: data.id,
			room,
		};

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

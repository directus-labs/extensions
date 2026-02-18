import { SaveCommitPayload, SaveConfirmedMessage, SaveConfirmMessage } from '../../shared/types/events';
import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../lib/bus';
import { useRooms } from '../lib/use-rooms';
import { BroadcastPayload, Context, RealtimeWebSocket } from '../types';

interface HandleSaveMeta {
	event: string;
	keys: (number | string)[];
	collection: string;
}

export async function handleSaveConfirm(
	client: RealtimeWebSocket,
	message: Omit<SaveConfirmMessage, 'type'>,
	ctx: Context,
) {
	const { env } = ctx;

	const rooms = useRooms();
	const bus = useBus(env);

	const room = rooms.get(message.room);

	if (!room) return;

	// init tracking for who has confirmed save
	const savedById = new Set<string>();
	room.users.forEach((u) => {
		if (u.id !== client.id) {
			savedById.add(u.id);
		}
	});
	room.saves.set(client.id, savedById);

	// We should not wait for responses if no others in the room
	if (savedById.size === 0) {
		try {
			client.send(JSON.stringify({ event: 'save:commit', room: message.room } as SaveCommitPayload));
		} catch {
			// ignore
		}
		return;
	}

	const broadcast: BroadcastPayload = {
		type: 'save:confirm',
		originId: client.id,
		room: room.name,
		data: {
			savedAt: message.savedAt,
		},
	};
	bus.publish(BROADCAST_CHANNEL, broadcast);
}

export async function handleSaveConfirmed(
	client: RealtimeWebSocket,
	message: Omit<SaveConfirmedMessage, 'type'>,
	ctx: Context,
) {
	const { env } = ctx;

	const bus = useBus(env);

	const broadcast: BroadcastPayload = {
		type: 'save:confirmed',
		room: message.room,
		originId: client.id,
		data: {
			id: message.id,
		},
	};

	bus.publish(BROADCAST_CHANNEL, broadcast);
}

export async function handleSaveCommitted(meta: Record<string, unknown>, ctx: Context) {
	const { env } = ctx;
	const { keys, collection } = meta as unknown as HandleSaveMeta;

	const rooms = useRooms();
	const bus = useBus(env);

	for (const key of keys) {
		const roomName = `${collection}:${key}`;
		const room = rooms.get(roomName);

		if (!room) {
			continue;
		}

		const broadcast: BroadcastPayload = {
			type: 'save:committed',
			room: room.name,
		};

		bus.publish(BROADCAST_CHANNEL, broadcast);
	}
}

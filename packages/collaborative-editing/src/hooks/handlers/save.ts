import { BROADCAST_CHANNEL } from '../constants';
import { useBus } from '../modules/bus';
import { useRooms } from '../modules/use-rooms';
import { BroadcastPayload, Context } from '../types';

interface HandleSaveMeta {
	event: string;
	payload: Record<string, unknown>;
	keys: (number | string)[];
	collection: string;
}

export async function handleSave(meta: Record<string, unknown>, ctx: Context) {
	const { env } = ctx;
	const { keys, collection } = meta as unknown as HandleSaveMeta;

	const rooms = useRooms();
	const bus = useBus(env);

	console.log(`[realtime:save] Event received for ${collection}`);

	for (const key of keys) {
		const roomName = `${collection}:${key}`;
		const room = rooms.get(roomName);

		if (!room) {
			continue;
		}

		const broadcast: BroadcastPayload = {
			type: 'save',
			room: roomName,
		};
		bus.publish(BROADCAST_CHANNEL, broadcast);
	}
}

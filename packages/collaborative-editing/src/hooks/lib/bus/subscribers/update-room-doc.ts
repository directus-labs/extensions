import * as Y from 'yjs';
import { BROADCAST_CHANNEL } from '../../../constants';
import { BroadcastContext, BroadcastPayload, BroadcastRoomDocPayload } from '../../../types';
import { useRooms } from '../../use-rooms';
import { useBus } from '../use-bus';

export function updateRoomDoc(payload: BroadcastRoomDocPayload, ctx: BroadcastContext) {
	const { env } = ctx;
	const { data, origin, room: roomName } = payload;

	const bus = useBus(env);
	const rooms = useRooms();

	const room = rooms.get(roomName);

	if (!room || !data) return;

	// Apply update to room doc, this will ensure its shared globally for anyone who joins the room
	const changeDoc = new Y.Doc();
	Y.applyUpdate(changeDoc, Y.encodeStateAsUpdate(room.doc));

	for (const field of Object.keys(data)) {
		changeDoc.getMap(room.name).set(field, data[field]);
	}
	Y.applyUpdate(room.doc, Y.encodeStateAsUpdate(changeDoc));

	const updatePayload: Record<string, unknown> = {};
	for (const field of Object.keys(data)) {
		updatePayload[field] = room.doc.getMap(room.name).get(field);
	}

	const broadcast: BroadcastPayload = {
		type: 'update',
		room: room.name,
		data: updatePayload,
		origin,
	};
	bus.publish(BROADCAST_CHANNEL, broadcast);
}

import { BroadcastContext, BroadcastPayload } from '../../types';
import { broadcastFieldAwareness } from './subscribers/broadcast-field-awareness';
import { broadcastSave } from './subscribers/broadcast-save';
import { broadcastUpdate } from './subscribers/broadcast-update';
import { broadcastUserAwareness } from './subscribers/broadcast-user-awareness';
import { updateRoomDoc } from './subscribers/update-room-doc';

export function handleBroadcast(payload: BroadcastPayload, ctx: BroadcastContext) {
	if (payload.type === 'update') {
		broadcastUpdate(payload, ctx);
	} else if (payload.type === 'awareness-field') {
		broadcastFieldAwareness(payload, ctx);
	} else if (payload.type === 'awareness-user') {
		broadcastUserAwareness(payload, ctx);
	} else if (payload.type === 'room-doc') {
		updateRoomDoc(payload, ctx);
	} else if (payload.type === 'save') {
		broadcastSave(payload);
	}
}

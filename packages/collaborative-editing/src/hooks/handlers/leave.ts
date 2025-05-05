import { Context, DirectusWebsocket, WebsocketMessage } from '../types';
import { useDocs } from '../utils/use-docs';
import { useSockets } from '../utils/use-sockets';

export interface HandleLeavePayload extends WebsocketMessage {
	type: 'leave';
	room: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleLeave(client: DirectusWebsocket, payload: HandleLeavePayload, _ctx: Context) {
	const docs = useDocs();
	console.log(`removed room: ${payload.room}`);
	client.rooms.delete(payload.room);

	// delete doc if they are last client in the room
	if (isRoomEmpty(payload.room)) {
		docs.remove(payload.room);
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

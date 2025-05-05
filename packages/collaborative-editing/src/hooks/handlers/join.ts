import { Context, DirectusWebsocket, WebsocketMessage } from '../types';
import { useDocs } from '../utils/use-docs';

export interface HandleJoinPayload extends WebsocketMessage {
	type: 'join';
	room: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleJoin(client: DirectusWebsocket, payload: HandleJoinPayload, _ctx: Context) {
	const docs = useDocs();

	console.log(`added room: ${payload.room}`);
	client.rooms.add(payload.room);

	if (docs.has(payload.room) === false) {
		console.log(`created doc for room ${payload.room}`);
		docs.add(payload.room);
	}
}

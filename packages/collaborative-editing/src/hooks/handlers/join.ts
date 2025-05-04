import { Context, DirectusWebsocket, WebsocketMessage } from '../types';

export interface HandleJoinPayload extends WebsocketMessage {
	type: 'join';
	room: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleJoin(client: DirectusWebsocket, payload: HandleJoinPayload, _ctx: Context) {
	console.log(`added room: ${payload.room}`);
	client.rooms.add(payload.room);
}

import { Context, DirectusWebsocket, WebsocketMessage } from '../types';

export interface HandleLeavePayload extends WebsocketMessage {
	type: 'leave';
	room: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function handleLeave(client: DirectusWebsocket, payload: HandleLeavePayload, _ctx: Context) {
	console.log(`removed room: ${payload.room}`);
	client.rooms.delete(payload.room);
}

import { defineHook } from '@directus/extensions-sdk';
import { ServerEvent } from '../types/events';
import { BROADCAST_CHANNEL } from './constants';
import {
	handleActivate,
	handleClose,
	handleConnect,
	handleDeactivate,
	handleJoin,
	handleLeave,
	handleSave,
	handleUpdate,
} from './handlers';
import { handleBroadcast, useBus } from './modules/bus';
import { useSockets } from './modules/use-sockets';
import { BroadcastPayload } from './types';

export default defineHook(async ({ action }, ctx) => {
	const sockets = useSockets();
	const bus = useBus(ctx.env);

	action('websocket.message', async ({ message, client }) => {
		if (!client.accountability?.user) return;
		if (message.type !== 'yjs-connect' && sockets.has(client.uid) === false) return;

		console.log(`[realtime:message] Client ${client.uid} sent message ${message.type}`);

		const { type, ...payload } = message;

		switch (type as ServerEvent) {
			case 'yjs-connect':
				handleConnect(client, payload);
				break;
			case 'update':
				handleUpdate(client, payload, ctx);
				break;
			case 'activate':
				handleActivate(client, payload, ctx);
				break;
			case 'deactivate':
				handleDeactivate(client, payload, ctx);
				break;
			case 'join':
				handleJoin(client, payload, ctx);
				break;
			case 'leave':
				handleLeave(client, payload, ctx);
				break;
		}
	});

	bus.subscribe(BROADCAST_CHANNEL, (payload: BroadcastPayload) => {
		handleBroadcast(payload, ctx);
	});

	action('websocket.close', ({ client }) => {
		handleClose(client, ctx);
	});

	action('items.update', (meta) => {
		handleSave(meta, ctx);
	});
});

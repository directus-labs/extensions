import { defineHook } from '@directus/extensions-sdk';
import { handleActivate, handleConnect, handleDeactivate, handleJoin, handleLeave, handleUpdate } from './handlers';
import { useSockets } from './modules/use-sockets';
import { ServerEvent } from './types';

export default defineHook(async ({ action }, ctx) => {
	const sockets = useSockets();

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
				handleDeactivate(client, payload);
				break;
			case 'join':
				handleJoin(client, payload, ctx);
				break;
			case 'leave':
				handleLeave(client, payload);
				break;
		}
	});

	action('websocket.close', ({ client }) => {
		// leave all rooms
		client.rooms.forEach((room: string) => {
			handleLeave(client, { room });
		});

		sockets.delete(client.uid);

		console.log(`[realtime:close] Client ${client.uid} has closed the connection, removed from all rooms`);
	});
});

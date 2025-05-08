import { defineHook } from '@directus/extensions-sdk';
import { handleActivate, handleConnect, handleDeactivate, handleJoin, handleLeave, handleUpdate } from './handlers';
import { useSockets } from './modules/use-sockets';
import { ServerEvent } from './types';

export default defineHook(async ({ action }, ctx) => {
	const sockets = useSockets();

	action('websocket.message', async ({ message, client }) => {
		if (!client.accountability) return;
		if (message.type !== 'yjs-connect' && sockets.has(client.uid) === false) return;

		console.log('client.id', client.id);

		switch (message.type as ServerEvent) {
			case 'yjs-connect':
				handleConnect(client, message);
				break;
			case 'update':
				handleUpdate(client, message, ctx);
				break;
			case 'activate':
				handleActivate(client, message, ctx);
				break;
			case 'deactivate':
				handleDeactivate(client, message);
				break;
			case 'join':
				handleJoin(client, message, ctx);
				break;
			case 'leave':
				handleLeave(client, message);
				break;
		}
	});

	action('websocket.close', ({ client }) => {
		// leave all rooms
		client.rooms.forEach((room: string) => {
			handleLeave(client, { type: 'leave', room });
		});

		sockets.delete(client.uid);
	});
});

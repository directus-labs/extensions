import { defineHook } from '@directus/extensions-sdk';
import { handleActivate, handleConnect, handleDeactivate, handleJoin, handleLeave, handleUpdate } from './handlers';
import { ServerEvent } from './types';
import { useSockets } from './utils/use-sockets';

export default defineHook(async ({ action }, ctx) => {
	const store = useSockets();

	action('websocket.message', async ({ message, client }) => {
		if (!client.accountability) return;
		if (message.type !== 'yjs-connect' && store.has(client.uid) === false) return;

		console.log('uid', client.uid);

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
		store.delete(client);
	});
});

import { defineHook } from '@directus/extensions-sdk';
import { handleConnect, handleJoin, handleLeave, handleUpdate } from './handlers';
import { YJSEvent } from './types';
import { useSockets } from './utils/use-sockets';

export default defineHook(async ({ action }, ctx) => {
	const store = useSockets();

	action('websocket.message', async ({ message, client }) => {
		if (!client.accountability) return;
		if (message.type !== 'yjs-connect' && store.has(client) === false) return;

		console.log('uid', client.uid);

		switch (message.type as YJSEvent) {
			case 'yjs-connect':
				handleConnect(client);
				break;
			case 'update':
				handleUpdate(client, message, ctx);
				break;
			case 'join':
				handleJoin(client, message, ctx);
				break;
			case 'leave':
				handleLeave(client, message, ctx);
				break;
		}
	});

	action('websocket.close', ({ client }) => {
		store.delete(client);
	});
});

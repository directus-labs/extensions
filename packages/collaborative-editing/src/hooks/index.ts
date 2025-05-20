import { defineHook } from '@directus/extensions-sdk';
import { ServerEvent } from '../types/events';
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
import { useSockets } from './modules/use-sockets';

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
		handleClose(client);
	});

	action('items.update', (meta, eventContext) =>
		handleSave(meta, {
			database: ctx.database,
			schema: eventContext.schema,
			accountability: eventContext.accountability,
			services: ctx.services,
		}),
	);
});

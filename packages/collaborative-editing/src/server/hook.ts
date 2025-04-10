import type { DirectusContext } from './types';
import { defineHook } from '@directus/extensions-sdk';

import { createHocuspocusServer } from './hocuspocus';
import { createDirectusWebSocket } from './websocket';

export default defineHook(({ init }, { logger, services, getSchema, env, database }: DirectusContext) => {
	let collaborativeEditingInitialized = false;

	// Configure hocuspocus server
	const hocuspocus = createHocuspocusServer({
		database,
		logger,
		env,
		getSchema,
		services,
	});

	// Initialize the WebSocket server on first request
	init('middlewares.after', ({ app }) => {
		app.use((req: any, res: any, next: () => void) => {
			if (collaborativeEditingInitialized || !req.socket) {
				next();
				return;
			}

			const server = req.socket._server || req.socket.server;

			if (!server) {
				next();
				return;
			}

			try {
				logger.info('Setting up collaborative editing WebSocket handler');

				// Create WebSocket helper with our configuration
				const wsHelper = createDirectusWebSocket({
					logger,
					env,
					getSchema,
					services,
					hocuspocus,
					database,
				});

				// Inject the WebSocket handler into the server
				wsHelper.injectWebSocket(server);

				collaborativeEditingInitialized = true;
				logger.info('WebSocket handler attached to server successfully');
			}
			catch (error) {
				logger.error('Failed to set up WebSocket handler:', error instanceof Error ? error.message : String(error));
			}

			next();
		});
	});

	init('routes.custom.before', ({ app }) => {
		app.get('/collaboration/status', (req: any, res: any) => {
			res.json({
				status: 'ok',
				initialized: collaborativeEditingInitialized,
				websocket_url: `${req.secure ? 'wss' : 'ws'}://${req.headers.host}/collaboration/{documentId}`,
			});
		});
	});
});

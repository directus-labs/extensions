import { defineHook } from '@directus/extensions-sdk';
import { WebSocketServer } from 'ws';
import { hocuspocus } from './hocuspocus';

export default defineHook(({ init }, { logger }) => {
	let collaborativeEditingInitialized = false;

	const wss = new WebSocketServer({ noServer: true });

	// Initialize the WebSocket server on first request
	init('middlewares.before', ({ app }) => {
		app.use((req, res, next) => {
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
				logger.info('Setting up HocusPocus WebSocket handler');

				// Listen for upgrade events
				server.prependListener('upgrade', (request, socket, head) => {
					// Check if this is a request to our collaboration endpoint
					if (request.url?.startsWith('/collaboration') && !request.url?.includes('/status')) {
						try {
							// Extract document ID from URL path
							const pathSegments = request.url.split('/').filter(Boolean);
							const documentId = pathSegments.at(-1);

							if (!documentId) {
								logger.warn('WebSocket connection without document ID');
								socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
								socket.destroy();
								return;
							}

							logger.info(`Handling WebSocket upgrade for: ${documentId}`);

							// Handle the upgrade with our WebSocket server
							wss.handleUpgrade(request, socket, head, (ws) => {
								logger.info(`WebSocket connection established for: ${documentId}`);

								// Pass to HocusPocus
								hocuspocus.handleConnection(ws, request, { documentId });
							});
						}
						catch (error) {
							logger.error('Error handling WebSocket upgrade:', error instanceof Error ? error.message : String(error));
							socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
							socket.destroy();
						}
					}
				});

				collaborativeEditingInitialized = true;
				logger.info('WebSocket handler attached to server successfully');
			}
			catch (error) {
				logger.error('Failed to set up WebSocket handler:', error instanceof Error ? error.message : String(error));
			}

			next();
		});
	});

	// Register endpoints using hook vs endpoint extension
	init('routes.custom.before', ({ app }) => {
		app.get('/collaboration/status', (req, res) => {
			// Return status
			res.json({
				status: 'ok',
				initialized: collaborativeEditingInitialized,
				websocket_url: `${req.secure ? 'wss' : 'ws'}://${req.headers.host}/collaboration/{documentId}`,
			});
		});

		// Handle document requests
		app.get('/collaboration/:documentId', (req, res) => {
			const documentId = req.params.documentId;

			res.json({
				document_id: documentId,
				status: collaborativeEditingInitialized ? 'ready' : 'not_initialized',
				websocket_url: `${req.secure ? 'wss' : 'ws'}://${req.headers.host}/collaboration/${documentId}`,
			});
		});

		logger.info('Collaborative editing endpoints registered');
	});
});

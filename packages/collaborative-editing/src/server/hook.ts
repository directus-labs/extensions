import { defineHook } from '@directus/extensions-sdk';
import { Server } from '@hocuspocus/server';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

import { WebSocketServer } from 'ws';

export default defineHook(({ init }, { logger, services, getSchema, env }) => {
	let collaborativeEditingInitialized = false;
	const { UsersService } = services;
	const hocuspocus = Server.configure({
		onAwarenessUpdate: async ({ states, context, requestHeaders }) => {
			try {
				const cookies = requestHeaders.cookie;

				logger.info(`States: ${JSON.stringify(states)}`);

				logger.info(`Cookie header: ${cookies}`);

				const presentUsers = states.map((state) => state.user.id);

				if (cookies) {
					const tokenMatch = cookie.parse(cookies).directus_session_token;

					logger.info(`Token match: ${tokenMatch}`);

					const decoded = jwt.verify(tokenMatch, env.SECRET);

					logger.info(`Decoded token: ${JSON.stringify(decoded)}`);

					const schema = await getSchema();

					const usersService = new UsersService({
						schema,
						accountability: {
							user: decoded.id,
							role: decoded.role,
							session: decoded.session,
							admin: decoded.admin,
							app: decoded.app,
						},
					});

					logger.info('Users service is ready');

					const availableUsers = await usersService.readByQuery({
						fields: ['id', 'first_name', 'last_name', 'avatar'],

					});

					logger.info(`Available users: ${JSON.stringify(availableUsers)}`);

					// Filter out the user who is currently editing
					const filteredAvailableUsers = availableUsers.filter((user) => user.id !== decoded.id);

					// Make other users who aren't in the available user list anonymous
					const anonymousUsers = new Set(presentUsers.filter((user) => !filteredAvailableUsers.some((availableUser) => availableUser.id === user)));

					// Update the states to be anonymous
					for (const state of states) {
						if (anonymousUsers.has(state.user.id)) {
							state.user.first_name = 'Anonymous';
							state.user.last_name = '';
							state.user.avatar = null;
						}
					}

					logger.info(`States: ${JSON.stringify(states)}`);
				}
			}
			catch (error) {
				logger.error(`Error in onAwarenessUpdate: ${error instanceof Error ? error.message : String(error)}`);
			}
		},
	});

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

								// Pass to HocusPocus with document ID and schema context
								hocuspocus.handleConnection(ws, request, {
									documentId,
									schema: services.SchemaService.schema,
								});
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

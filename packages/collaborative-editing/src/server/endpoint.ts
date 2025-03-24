import { Database } from '@hocuspocus/extension-database';
import { Server } from '@hocuspocus/server';
import expressWs from 'express-ws';

export default {
	id: 'collaboration',
	handler: (router, context) => {
		const { services, getSchema, database, env } = context;

		// Initialize Hocuspocus server
		const hocuspocus = Server.configure({
			extensions: [

			],

			// Handle authentication using Directus session
			async onAuthenticate({ request, token, documentName }) {
				try {
					// Verify the JWT token using Directus auth services
					const authenticationService = new services.AuthenticationService({
						schema: await getSchema(),
						accountability: null,
					});

					const user = await authenticationService.verifyJWT(token);

					if (!user) {
						throw new Error('Invalid token');
					}

					// You could implement additional permission checks here
					// For example, checking if the user has access to the specific document

					return {
						user: {
							id: user.id,
							email: user.email,
							role: user.role,
						},
					};
				}
				catch (error) {
					context.logger.error(`Authentication error: ${error.message}`);
					throw new Error('Authentication failed');
				}
			},
		});

		// // Add WebSocket support to Express
		expressWs(router);

		// // Set up WebSocket endpoint
		router.ws('/:documentName', (ws, req) => {
			const { documentName } = req.params;
			const token = req.query.token;

			hocuspocus.handleConnection(ws, req, {
				documentName,
				token,
			});
		});

		// Also add a REST endpoint to check status
		router.get('/status', (req, res) => {
			res.json({
				status: 'active',
				connections: hocuspocus.getConnectionsCount(),
			});
		});
	},
};

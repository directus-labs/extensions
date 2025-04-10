import type { Server } from '@hocuspocus/server';
import type { Server as HttpServer, IncomingMessage } from 'node:http';
import type { Http2SecureServer, Http2Server } from 'node:http2';
import type { Duplex } from 'node:stream';
import type { WebSocket } from 'ws';
import type { DirectusContext } from './types';
import { WebSocketServer } from 'ws';
import { tokenToAccountability } from '../utils/token-to-accountability';
import { verifyToken } from '../utils/verify-jwt';

export interface WebSocketContext extends DirectusContext {
	hocuspocus: typeof Server;
}

export interface DirectusWebSocket {
	injectWebSocket: (server: HttpServer | Http2Server | Http2SecureServer) => void;
}

/**
 * Creates a WebSocket helper for Directus collaborative editing
 */
export const createDirectusWebSocket = (options: WebSocketContext): DirectusWebSocket => {
	const { logger, env, hocuspocus } = options;
	const wss = new WebSocketServer({ noServer: true });

	return {
		injectWebSocket(server) {
			server.on('upgrade', (request: IncomingMessage, socket: Duplex, head) => {
				// Only handle collaboration endpoint requests
				if (request.url?.startsWith('/collaboration') && !request.url?.includes('/status')) {
					try {
						// Extract document ID from URL
						const pathSegments = request.url.split('/').filter(Boolean);
						const documentId = pathSegments.at(-1);

						if (!documentId) {
							logger.warn('WebSocket connection without document ID');
							socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
							socket.destroy();
							return;
						}

						const decoded = verifyToken({ requestHeaders: request.headers, logger, env, logPrefix: 'WebSocket upgrade' });

						if (!decoded) {
							logger.warn('WebSocket connection without valid token');
							socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
							socket.destroy();
							return;
						}

						// Handle the upgrade with our WebSocket server
						wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
							logger.info(`WebSocket connection established for: ${documentId}`);

							const context = {
								documentId,
								accountability: tokenToAccountability(decoded),
							};

							hocuspocus.handleConnection(ws, request, context);
						});
					}
					catch (error) {
						logger.error('Error handling WebSocket upgrade:', error instanceof Error ? error.message : String(error));
						socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
						socket.destroy();
					}
				}
			});
		},
	};
};
